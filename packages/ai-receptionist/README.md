# @loctelli/ai-receptionist

AI-powered receptionist that handles phone calls, video calls, SMS, and emails for your business.

> **Status:** 🚧 Early development - not ready for production

## Features

- 📞 **Phone & Video Calls** - AI answers and qualifies calls 24/7
- 💬 **SMS Conversations** - Automated text message handling
- 📧 **Email Responses** - Smart email thread management
- 📅 **Appointment Booking** - Direct Google Calendar integration
- 📊 **Lead Logging** - Automatic logging to Google Sheets
- 🔔 **Client Notifications** - SMS/Email alerts when appointments are booked
- 🧠 **Context-Aware** - Understands your business, services, and pricing
- 🔄 **Appointment Management** - Handle cancellations and rescheduling

## Use Cases

Perfect for service businesses that need to:
- Answer customer calls 24/7
- Qualify leads automatically
- Book appointments without human intervention
- Handle cancellations and rescheduling
- Capture every opportunity

**Ideal for:** HVAC, Roofing, Plumbing, Landscaping, Home Services, Contractors, etc.

## Installation

```bash
npm install @loctelli/ai-receptionist
```

## Quick Start

### Phone Call Example

```typescript
import { AIReceptionist } from '@loctelli/ai-receptionist';

const receptionist = new AIReceptionist({
  apiKey: process.env.LOCTELLI_API_KEY,
  apiUrl: 'https://ai-receptionist.loctelli.com',
});

// Handle incoming phone call
const call = await receptionist.handleCall({
  channel: 'phone',
  phoneNumber: '+1234567890',
  leadId: '123',
  strategyId: '456',
  agentConfig: {
    name: 'Sarah',
    role: 'Customer Service Representative',
    tone: 'friendly',
    businessInfo: {
      name: 'ABC Roofing',
      services: ['Roof Repair', 'Roof Replacement', 'Emergency Service'],
      hours: 'Mon-Fri 8AM-6PM, Sat 9AM-2PM',
      location: '123 Main St, Dallas, TX',
    },
  },
});

// Listen to call events
call.on('transcript', (event) => {
  console.log(`${event.speaker}: ${event.text}`);
});

call.on('appointment_booked', (event) => {
  console.log('Appointment booked:', event.appointment);
});

call.on('ended', (summary) => {
  console.log('Call Summary:', summary);
  console.log('Qualified:', summary.qualified);
  console.log('Outcome:', summary.outcome);
});
```

### SMS Conversation Example

```typescript
// Handle incoming SMS
const sms = await receptionist.handleSMS({
  channel: 'sms',
  phoneNumber: '+1234567890',
  leadId: '123',
  strategyId: '456',
  agentConfig: {
    name: 'Sarah',
    role: 'Customer Service Rep',
    tone: 'friendly',
    businessInfo: {
      name: 'ABC Roofing',
      services: ['Roof Repair', 'Roof Replacement'],
      hours: 'Mon-Fri 8AM-6PM',
    },
  },
});

sms.on('message_received', (msg) => {
  console.log('Customer:', msg.body);
});

sms.on('message_sent', (msg) => {
  console.log('AI:', msg.body);
});

sms.on('appointment_booked', (event) => {
  console.log('Booked via SMS:', event.appointment);
});
```

### Email Example

```typescript
// Handle incoming email
const email = await receptionist.handleEmail({
  channel: 'email',
  emailAddress: 'customer@example.com',
  subject: 'Question about roof repair',
  leadId: '123',
  strategyId: '456',
  agentConfig: {
    name: 'Sarah',
    role: 'Customer Service Manager',
    tone: 'professional',
    businessInfo: {
      name: 'ABC Roofing',
      services: ['Roof Repair', 'Roof Replacement'],
      hours: 'Mon-Fri 8AM-6PM',
    },
  },
});

email.on('email_received', (msg) => {
  console.log('Customer email:', msg.subject);
});

email.on('email_sent', (msg) => {
  console.log('AI response sent');
});
```

## Integrations

### Google Calendar

```typescript
const calendarConfig = {
  calendarId: 'primary',
  credentials: {
    accessToken: 'ya29.xxx',
    refreshToken: 'xxx',
  },
  defaultDuration: 60, // minutes
  businessHours: {
    monday: { start: '08:00', end: '18:00' },
    tuesday: { start: '08:00', end: '18:00' },
    wednesday: { start: '08:00', end: '18:00' },
    thursday: { start: '08:00', end: '18:00' },
    friday: { start: '08:00', end: '18:00' },
  },
};

receptionist.configureCalendar(calendarConfig);
```

### Google Sheets

```typescript
const sheetsConfig = {
  spreadsheetId: 'abc123',
  sheetName: 'Leads',
  credentials: {
    accessToken: 'ya29.xxx',
    refreshToken: 'xxx',
  },
  columnMapping: {
    name: 'A',
    phone: 'B',
    email: 'C',
    service: 'D',
    appointmentDate: 'E',
    appointmentTime: 'F',
    status: 'G',
    notes: 'H',
  },
};

receptionist.configureSheets(sheetsConfig);
```

### Client Notifications

```typescript
const notificationConfig = {
  sms: {
    enabled: true,
    phoneNumber: '+1234567890', // Your business number
    provider: 'twilio',
    template: 'New appointment booked with {leadName} for {serviceType} on {date} at {time}',
  },
  email: {
    enabled: true,
    emailAddress: 'owner@abcroofing.com',
    provider: 'sendgrid',
  },
};

receptionist.configureNotifications(notificationConfig);
```

## Configuration

### Environment Variables

```bash
# API Configuration
LOCTELLI_AI_RECEPTIONIST_API_KEY=lct_xxx
LOCTELLI_AI_RECEPTIONIST_API_URL=https://ai-receptionist.loctelli.com

# Google Calendar
GOOGLE_CALENDAR_ID=primary
GOOGLE_OAUTH_ACCESS_TOKEN=ya29.xxx
GOOGLE_OAUTH_REFRESH_TOKEN=xxx

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=abc123
GOOGLE_SHEETS_SHEET_NAME=Leads

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Notifications
BUSINESS_NOTIFICATION_PHONE=+1234567890
BUSINESS_NOTIFICATION_EMAIL=owner@business.com
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Customer (Phone/SMS/Email)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Receptionist API (ai-receptionist.loctelli.com)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Phone/     │  │   SMS        │  │   Email      │      │
│  │   Video AI   │  │   Handler    │  │   Handler    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Integration Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Google     │  │   Google     │  │    Twilio    │      │
│  │   Calendar   │  │   Sheets     │  │     SMS      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

This SDK is a client wrapper around the AI Receptionist API. The server handles:
- AI conversation processing
- Speech-to-text / Text-to-speech
- Calendar availability checking
- Spreadsheet updates
- Notification delivery

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Watch mode
npm run dev
```

## API Reference

See [TypeScript types](./src/types.ts) for full API documentation.

### Main Classes

- `AIReceptionist` - Main SDK class
- `PhoneClient` - Phone call handling
- `VideoClient` - Video call handling
- `SMSClient` - SMS conversation handling
- `EmailClient` - Email thread handling

### Events

**Call Events:**
- `connected` - Call established
- `transcript` - Live transcription
- `agent_speaking` - AI is speaking
- `lead_speaking` - Customer is speaking
- `appointment_booked` - Appointment created
- `ended` - Call completed with summary

**SMS Events:**
- `message_received` - Customer sent SMS
- `message_sent` - AI sent SMS
- `appointment_booked` - Appointment created
- `conversation_ended` - SMS thread completed

**Email Events:**
- `email_received` - Customer sent email
- `email_sent` - AI sent email
- `appointment_booked` - Appointment created
- `conversation_ended` - Email thread completed

## Roadmap

### MVP (Phase 1)
- [x] TypeScript types
- [ ] Phone call handling
- [ ] SMS conversation handling
- [ ] Email thread handling
- [ ] Google Calendar integration
- [ ] Google Sheets integration
- [ ] Twilio SMS integration
- [ ] Client notifications

### Phase 2
- [ ] Appointment rescheduling
- [ ] Payment collection
- [ ] Analytics dashboard
- [ ] React hooks (`@loctelli/ai-receptionist-react`)
- [ ] Webhooks

### Phase 3
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Custom integrations
- [ ] Python SDK
- [ ] Mobile SDKs

## Pricing

Contact sales for pricing: sales@loctelli.com

Estimated costs:
- Phone calls: ~$0.50-2.00 per call (depends on length)
- SMS: ~$0.10-0.30 per conversation
- Email: ~$0.05-0.15 per thread

## License

MIT

## Links

- [Documentation](https://docs.loctelli.com/ai-receptionist)
- [API Reference](https://ai-receptionist.loctelli.com/api/docs)
- [Examples](./examples)
- [Requirements](./REQUIREMENTS.md)

## Support

- GitHub Issues: [loctelli/ai-receptionist/issues](https://github.com/loctelli/ai-receptionist/issues)
- Discord: [loctelli.com/discord](https://loctelli.com/discord)
- Email: support@loctelli.com
