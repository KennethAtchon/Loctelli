# Admin Dashboard Global Subaccount Filter Design

## Overview
This design introduces a global subaccount filtering system to the admin dashboard that allows administrators to easily switch between viewing data for different subaccounts or the global view. The filter will be prominently displayed in the header and will affect all dashboard panels and data displays.

## Current State Analysis
- **Admin Layout**: Uses a sidebar navigation with header
- **Dashboard**: Shows global stats for all users, strategies, leads, and bookings
- **Subaccounts**: Currently managed as a separate page with CRUD operations
- **Data Structure**: Subaccounts have their own users, strategies, leads, and bookings

## Design Requirements

### 1. Global Filter Component
**Location**: Header component (top-right, next to user menu)
**Purpose**: Allow switching between subaccount contexts

**Filter Options**:
- `GLOBAL` - View all data across all subaccounts (default)
- `SUBACCOUNT1_NAME` - Filter to specific subaccount
- `SUBACCOUNT2_NAME` - Filter to specific subaccount
- etc.

### 2. Visual Design
**Component Type**: Dropdown/Select component
**Styling**: 
- Prominent but not overwhelming
- Clear visual indication of current selection
- Consistent with existing UI design system
- Badge showing current filter status

**Layout**:
```
[Loctelli CRM Logo]                    [GLOBAL ▼] [User Menu]
```

### 3. State Management
**Context**: New `SubaccountFilterContext` to manage global filter state
**Persistence**: Store selected filter in localStorage for session persistence
**Default**: Always start with "GLOBAL" selected

### 4. Data Filtering Logic
**Scope**: All dashboard panels and data displays
**Implementation**: 
- Filter API calls to include subaccount parameter when not "GLOBAL"
- Update all dashboard cards to show filtered data
- Maintain real-time updates when filter changes

### 5. User Experience
**Immediate Feedback**: 
- Loading states when switching filters
- Clear indication of which subaccount is being viewed
- Smooth transitions between filter states

**Accessibility**:
- Keyboard navigation support
- Screen reader friendly labels
- Clear visual hierarchy

## Technical Implementation Plan

### Phase 1: Context and State Management
1. Create `SubaccountFilterContext` with:
   - Current filter state
   - Available subaccounts list
   - Filter change handlers
   - Loading states

2. Create `useSubaccountFilter` hook for easy access

### Phase 2: Header Integration
1. Add filter dropdown to header component
2. Style to match existing design
3. Add loading indicators and error handling

### Phase 3: API Integration
1. Update API endpoints to accept subaccount filter parameter
2. Modify dashboard data fetching to include filter
3. Update all dashboard cards to use filtered data

### Phase 4: Dashboard Updates
1. Update dashboard page to use filtered data
2. Add filter-aware loading states
3. Update all stat cards and recent activity sections

### Phase 5: Cross-Page Consistency
1. Apply filter to other admin pages (users, strategies, leads, bookings)
2. Ensure consistent behavior across all admin sections

## Component Structure

```typescript
// SubaccountFilterContext
interface SubaccountFilterContextType {
  currentFilter: string; // "GLOBAL" or subaccount ID
  availableSubaccounts: SubAccount[];
  isLoading: boolean;
  setFilter: (filter: string) => void;
  getFilteredData: (data: any[]) => any[];
}

// Header Filter Component
interface SubaccountFilterProps {
  className?: string;
  variant?: "default" | "compact";
}
```

## API Changes Required

### Backend Endpoints
- Update dashboard stats endpoint to accept `subaccountId` parameter
- Update recent users/leads endpoints for filtering
- Add subaccount-specific aggregation endpoints

### Frontend API Client
- Modify API calls to include subaccount filter
- Add filter-aware data fetching methods
- Handle loading and error states

## Benefits

1. **Improved Navigation**: Easy switching between subaccount contexts
2. **Better Data Management**: Clear separation of subaccount data
3. **Enhanced User Experience**: Intuitive filtering system
4. **Scalability**: Easy to add more subaccounts
5. **Consistency**: Unified filtering across all admin pages

## Future Enhancements

1. **Bulk Operations**: Perform actions across multiple subaccounts
2. **Comparison Views**: Side-by-side subaccount comparisons
3. **Custom Dashboards**: Subaccount-specific dashboard layouts
4. **Export Filtered Data**: Export data for specific subaccounts
5. **Filter Presets**: Save commonly used filter combinations

This design provides a clean, intuitive way for administrators to manage and view data across different subaccounts while maintaining the existing dashboard functionality and user experience.