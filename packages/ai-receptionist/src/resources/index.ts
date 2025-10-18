/**
 * User-facing resources for the AI Receptionist SDK
 *
 * Each resource can be used standalone for better tree-shaking:
 * @example
 * import { CallsResource } from '@loctelli/ai-receptionist';
 */

export { CallsResource, type MakeCallOptions, type CallSession } from './calls.resource';
export { SMSResource, type SendSMSOptions, type SMSMessage } from './sms.resource';
export { EmailResource, type SendEmailOptions, type EmailMessage } from './email.resource';

// TODO: Implement CalendarResource
// export { CalendarResource, type BookAppointmentOptions, type Appointment } from './calendar.resource';
