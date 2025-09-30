# Booking System Improvement Plan

## Executive Summary

The current booking system has significant issues that prevent the AI from properly checking availability and booking meetings. Based on analysis of the conversation log and codebase, the main problems are:

1. **Date Understanding Issues**: AI is looking at November dates instead of October
2. **Availability Data Problems**: The `bookingsTime` field may not contain proper current data
3. **Booking Logic Gaps**: Multiple failure points in the booking flow
4. **Poor Error Handling**: Generic error messages don't help users understand what went wrong

## Current System Analysis

### Components Analyzed

1. **AI Tools Service** (`ai-tools.service.ts`)
   - Contains `check_availability` and `book_meeting` functions
   - Uses `bookingsTime` JSON field from user table
   - Has complex parsing logic for different data formats

2. **Booking Service** (`bookings.service.ts`)
   - Standard CRUD operations for bookings
   - Multi-tenant isolation with `subAccountId`
   - Permission checking for user access

3. **Booking Helper Service** (`booking-helper.service.ts`)
   - GoHighLevel integration for block slots
   - Legacy booking confirmation parsing
   - Calendar integration fallback logic

4. **Sales Bot Service** (`sales-bot.service.ts`)
   - Handles OpenAI function calling for booking tools
   - Integrates with AI tools for availability checking
   - Message history management

### Identified Issues

#### 1. **CRITICAL: Missing Availability Context in AI Prompts**
- **Available booking times are NOT included in the AI's system prompt**
- AI only discovers availability through tool calls AFTER making suggestions
- This causes the AI to suggest non-existent times and appear confused
- AI is "flying blind" without knowing what slots are actually available

#### 2. **Critical: Date/Time Context Problems**
- AI doesn't understand current date context properly
- Looking at November instead of October in conversation
- No validation of date requests against current time
- No timezone handling

#### 3. **High: Availability Data Reliability**
- `bookingsTime` field may not be populated correctly
- Background cron service updates may be failing
- Fallback slot generation logic is basic (9 AM - 5 PM, 30-min slots)
- No real-time calendar sync validation

#### 4. **High: Error Handling and User Experience**
- Generic "no availability" messages don't explain why
- AI repeats same options when slots aren't found
- No graceful degradation when calendar data is missing
- Poor feedback loop for booking failures

#### 5. **Medium: System Architecture**
- Complex parsing logic for different `bookingsTime` formats
- Multiple code paths for availability checking
- Legacy booking confirmation system alongside new function calling

## Improvement Plan

### Phase 1: Immediate Fixes (High Priority)

#### 1.0 **CRITICAL: Include Available Times in AI Prompt Context**
**Files to modify:**
- `structured-prompt.service.ts`
- `ai-tools.service.ts`

**Changes:**
```typescript
// In structured-prompt.service.ts, add to buildWithEnhancedBuilder method around line 83
if (user?.bookingEnabled) {
  const upcomingAvailability = await this.getUpcomingAvailability(user.id, 7); // Next 7 days

  if (upcomingAvailability.length > 0) {
    const availabilityContext = `
CURRENT BOOKING AVAILABILITY:
${upcomingAvailability.map(day =>
  `${day.date} (${this.formatDayName(day.date)}): ${
    day.slots.length > 0
      ? day.slots.map(slot => this.formatTime12Hour(slot)).join(', ')
      : 'No slots available'
  }`
).join('\n')}

BOOKING INSTRUCTIONS:
- When suggesting meeting times, ONLY offer times from the available slots above
- If no slots are available for requested date, suggest alternative dates with available times
- Always specify both date AND time when proposing meetings
- Use 12-hour format for times (e.g., "2:00 PM" instead of "14:00")`;

    this.promptBuilder.addContext(availabilityContext, 'BOOKING_AVAILABILITY', 5.5, false);
  } else {
    // Fallback: Generate default 9-5 EST schedule for next 7 days
    const defaultAvailability = this.generateDefaultSchedule(7);
    const fallbackContext = `
CURRENT BOOKING AVAILABILITY (Default Schedule):
${defaultAvailability.map(day =>
  `${day.date} (${this.formatDayName(day.date)}): ${day.slots.map(slot => this.formatTime12Hour(slot)).join(', ')}`
).join('\n')}

BOOKING INSTRUCTIONS:
- Using default business hours (9:00 AM - 5:00 PM EST, 30-minute slots)
- When suggesting meeting times, offer times from the available slots above
- Always specify both date AND time when proposing meetings`;

    this.promptBuilder.addContext(fallbackContext, 'BOOKING_AVAILABILITY', 5.5, false);
  }

  // Add tool instructions
  const toolInstructions = this.formatToolInstructions(template);
  this.promptBuilder.addCustom('TOOL_INSTRUCTIONS', toolInstructions, 6, false);
}

// Add helper method to structured-prompt.service.ts
private async getUpcomingAvailability(userId: number, days: number = 7): Promise<Array<{date: string, slots: string[]}>> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { bookingsTime: true, bookingEnabled: true }
  });

  if (!user?.bookingEnabled || !user.bookingsTime) {
    return [];
  }

  const availability: Array<{date: string, slots: string[]}> = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const checkDate = addDays(today, i);
    const dateStr = format(checkDate, 'yyyy-MM-dd');

    // Reuse the existing parsing logic from ai-tools.service.ts
    const slots = this.parseBookingsTimeForDate(user.bookingsTime, dateStr);

    if (slots.length > 0) {
      availability.push({ date: dateStr, slots });
    }
  }

  return availability;
}

private formatDayName(dateStr: string): string {
  return format(parseISO(dateStr), 'EEEE'); // e.g., "Monday"
}

private formatTime12Hour(time24: string): string {
  return format(parseISO(`2000-01-01T${time24}`), 'h:mm a'); // e.g., "2:00 PM"
}

// Add method to generate default schedule when no bookingsTime data exists
private generateDefaultSchedule(days: number = 7): Array<{date: string, slots: string[]}> {
  const schedule: Array<{date: string, slots: string[]}> = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const checkDate = addDays(today, i);
    const dateStr = format(checkDate, 'yyyy-MM-dd');

    // Skip weekends for default schedule
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Generate 9 AM - 5 PM EST slots (30-minute intervals)
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    schedule.push({ date: dateStr, slots });
  }

  return schedule;
}

// Move parsing logic from ai-tools.service.ts to shared location or inject ai-tools service
```

**Why this is critical:**
- The AI currently has NO knowledge of available times when responding to users
- This explains why it suggests non-existent times and appears confused
- Tool calls only happen AFTER the AI makes incorrect suggestions
- Including availability in the prompt gives the AI the information it needs upfront

#### 1.1 Fix Date Context Issues
**Files to modify:**
- `ai-tools.service.ts`
- `structured-prompt.service.ts`

**Changes:**
```typescript
// Add current date context to AI prompts
const currentDate = format(new Date(), 'yyyy-MM-dd');
const promptContext = `Today's date is ${currentDate}. When checking availability or booking meetings, ensure dates are on or after ${currentDate}.`;

// Add date validation in check_availability
private validateDateRequest(requestedDate: string): { isValid: boolean; message?: string } {
  const today = new Date();
  const requested = parseISO(requestedDate);

  if (isBefore(requested, today)) {
    return {
      isValid: false,
      message: `Cannot check availability for past dates. Today is ${format(today, 'yyyy-MM-dd')}.`
    };
  }

  // Only allow booking up to 30 days in advance
  const maxDate = addDays(today, 30);
  if (isAfter(requested, maxDate)) {
    return {
      isValid: false,
      message: `Can only book up to 30 days in advance. Latest available date is ${format(maxDate, 'yyyy-MM-dd')}.`
    };
  }

  return { isValid: true };
}
```

#### 1.2 Improve Availability Data Validation
**Files to modify:**
- `ai-tools.service.ts`
- `free-slot-cron.service.ts`

**Changes:**
```typescript
// Add data validation and better error handling
private async validateBookingsTimeData(userId: number): Promise<{ isValid: boolean; issues: string[] }> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { bookingsTime: true, bookingEnabled: true }
  });

  const issues: string[] = [];

  if (!user.bookingEnabled) {
    issues.push('Booking is disabled for this user');
  }

  if (!user.bookingsTime) {
    issues.push('No availability data configured');
  } else {
    try {
      const slots = this.parseBookingsTimeForDate(user.bookingsTime, format(new Date(), 'yyyy-MM-dd'));
      if (slots.length === 0) {
        issues.push('No availability slots found for current timeframe');
      }
    } catch (error) {
      issues.push('Invalid availability data format');
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
```

#### 1.3 Enhanced Error Messages
**Files to modify:**
- `ai-tools.service.ts`

**Changes:**
```typescript
// Return specific error messages instead of generic ones
private async checkAvailability(args: AvailabilityToolArgs, userId: number): Promise<ToolCallResult> {
  // Add date validation
  const dateValidation = this.validateDateRequest(args.date);
  if (!dateValidation.isValid) {
    return {
      success: false,
      message: dateValidation.message,
      data: { errorType: 'INVALID_DATE' }
    };
  }

  // Add data validation
  const dataValidation = await this.validateBookingsTimeData(userId);
  if (!dataValidation.isValid) {
    return {
      success: false,
      message: `Unable to check availability: ${dataValidation.issues.join(', ')}`,
      data: {
        errorType: 'DATA_ISSUES',
        issues: dataValidation.issues
      }
    };
  }

  // ... rest of availability logic
}
```

### Phase 2: Enhanced Functionality (Medium Priority)

#### 2.1 Smart Availability Suggestions
**New file:** `smart-availability.service.ts`

```typescript
@Injectable()
export class SmartAvailabilityService {
  /**
   * When no slots are available on requested date, suggest alternatives
   */
  async suggestAlternativeDates(
    originalDate: string,
    userId: number,
    preferredTimes?: string[]
  ): Promise<{ date: string; slots: string[] }[]> {
    const suggestions: { date: string; slots: string[] }[] = [];
    const startDate = parseISO(originalDate);

    // Check next 7 days for availability
    for (let i = 0; i < 7; i++) {
      const checkDate = addDays(startDate, i);
      const dateStr = format(checkDate, 'yyyy-MM-dd');

      const availableSlots = await this.getAvailableSlotsFromBookingsTime(
        // ... parameters
      );

      if (availableSlots.length > 0) {
        // Filter by preferred times if provided
        const filteredSlots = preferredTimes
          ? availableSlots.filter(slot => this.isTimeInPreferredRange(slot, preferredTimes))
          : availableSlots;

        if (filteredSlots.length > 0) {
          suggestions.push({ date: dateStr, slots: filteredSlots });
        }
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
}
```

#### 2.2 Booking Conflict Prevention
**Files to modify:**
- `ai-tools.service.ts`

**Changes:**
```typescript
// Add real-time conflict checking before booking
private async checkBookingConflicts(
  date: string,
  time: string,
  userId: number
): Promise<{ hasConflict: boolean; conflictDetails?: any }> {
  const proposedStart = parseISO(`${date}T${time}`);
  const proposedEnd = addMinutes(proposedStart, 30);

  // Check database for existing bookings
  const existingBookings = await this.prisma.booking.findMany({
    where: {
      regularUserId: userId,
      status: { in: ['pending', 'confirmed'] }
    }
  });

  for (const booking of existingBookings) {
    const bookingDetails = booking.details as any;
    if (bookingDetails?.date === date) {
      const existingStart = parseISO(`${date}T${bookingDetails.time}`);
      const existingEnd = addMinutes(existingStart, 30);

      // Check for overlap
      if (
        (proposedStart >= existingStart && proposedStart < existingEnd) ||
        (proposedEnd > existingStart && proposedEnd <= existingEnd) ||
        (proposedStart <= existingStart && proposedEnd >= existingEnd)
      ) {
        return {
          hasConflict: true,
          conflictDetails: {
            existingBookingId: booking.id,
            existingTime: bookingDetails.time,
            existingSubject: bookingDetails.subject
          }
        };
      }
    }
  }

  return { hasConflict: false };
}
```

### Phase 3: System Reliability (Lower Priority)

#### 3.1 Booking Data Monitoring
**New file:** `booking-health.service.ts`

```typescript
@Injectable()
export class BookingHealthService {
  /**
   * Monitor booking system health and data quality
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check users with booking enabled but no bookingsTime data
    const usersWithoutData = await this.prisma.user.count({
      where: {
        bookingEnabled: 1,
        bookingsTime: null
      }
    });

    if (usersWithoutData > 0) {
      issues.push(`${usersWithoutData} users have booking enabled but no availability data`);
      recommendations.push('Run background job to populate availability data');
    }

    // Check for stale bookingsTime data
    // ... additional health checks

    const status = issues.length === 0 ? 'healthy' :
                  issues.length <= 2 ? 'warning' : 'critical';

    return { status, issues, recommendations };
  }
}
```

#### 3.2 Improved Background Sync
**Files to modify:**
- `free-slot-cron.service.ts`

**Changes:**
```typescript
// Add retry logic and better error handling
async updateUserBookingsTimeWithRetry(userId: number, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await this.updateUserBookingsTime(userId);
      this.logger.log(`Successfully updated bookingsTime for userId=${userId} on attempt ${attempt}`);
      return true;
    } catch (error) {
      this.logger.warn(`Attempt ${attempt} failed for userId=${userId}: ${error}`);

      if (attempt === maxRetries) {
        this.logger.error(`Failed to update bookingsTime for userId=${userId} after ${maxRetries} attempts`);

        // Fallback: Set a basic availability schedule
        await this.setFallbackAvailability(userId);
        return false;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

## Implementation Timeline

### Week 1: Critical Fixes
- [ ] **PRIORITY 1:** Include available booking times in AI prompt context
- [ ] Fix date context in AI prompts
- [ ] Add date validation to availability checking
- [ ] Improve error messages
- [ ] Test with sample conversations

### Week 2: Enhanced Functionality
- [ ] Implement smart availability suggestions
- [ ] Add booking conflict prevention
- [ ] Update AI prompt instructions
- [ ] Integration testing

### Week 3: System Reliability
- [ ] Add booking health monitoring
- [ ] Improve background sync reliability
- [ ] Add comprehensive logging
- [ ] Performance optimization

### Week 4: Testing & Refinement
- [ ] End-to-end testing
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Documentation updates

## Success Metrics

1. **Booking Success Rate**: Target 95% successful bookings when slots are available
2. **User Experience**: Eliminate "repeating same options" scenarios
3. **Error Clarity**: Users understand why booking failed in 100% of error cases
4. **Date Accuracy**: AI correctly interprets and validates dates in 100% of cases
5. **System Reliability**: 99.9% uptime for booking availability checks

## Risk Mitigation

1. **Backward Compatibility**: Keep existing booking methods working during transition
2. **Gradual Rollout**: Test with limited users before full deployment
3. **Monitoring**: Add comprehensive logging and alerts
4. **Rollback Plan**: Ability to revert to previous system if issues arise

## Conclusion

The booking system improvements focus on three key areas:
1. **Immediate fixes** for date handling and error messaging
2. **Enhanced functionality** for better user experience
3. **System reliability** for long-term stability

These changes will transform the booking experience from a frustrating, error-prone process to a smooth, intelligent system that users can rely on.