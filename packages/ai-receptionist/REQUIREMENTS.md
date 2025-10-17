# Video Call AI Receptionist - Requirements Document

## Project Overview

An AI-powered receptionist system that handles incoming video/phone calls for businesses, qualifies leads, books appointments, and manages scheduling - all automated.

---

## 1. Functional Requirements

### 1.1 Call Handling

#### FR-1.1.1: Answer Incoming Calls
- **Description:** AI receptionist must answer all incoming calls automatically
- **Priority:** High
- **Acceptance Criteria:**
  - Call is answered within 3 rings (or equivalent for video)
  - Professional greeting is delivered
  - System identifies the business and introduces itself
  - Works 24/7 without downtime

#### FR-1.1.2: Natural Conversation
- **Description:** Engage in natural, human-like conversation with callers
- **Priority:** High
- **Acceptance Criteria:**
  - Understands caller intent (inquiry, booking, cancellation, etc.)
  - Responds contextually to questions
  - Handles interruptions gracefully
  - Maintains conversation context throughout call
  - Can handle multiple topics in one call

#### FR-1.1.3: Information Provision
- **Description:** Provide accurate information about business services
- **Priority:** High
- **Acceptance Criteria:**
  - Can answer common questions (hours, services, pricing, location)
  - Retrieves information from business knowledge base
  - Admits when it doesn't know and offers to have someone call back
  - Provides accurate, consistent information

### 1.2 Lead Qualification

#### FR-2.1: Problem/Service Identification
- **Description:** Identify what problem caller has or what service they need
- **Priority:** High
- **Acceptance Criteria:**
  - Asks qualifying questions naturally
  - Categorizes the type of service needed
  - Determines urgency level
  - Identifies if this is a qualified lead or not

#### FR-2.2: Contact Information Collection
- **Description:** Collect caller's contact details
- **Priority:** Critical
- **Acceptance Criteria:**
  - Captures: Name, Phone Number, Email (optional)
  - Validates phone number format
  - Confirms spelling of name
  - Stores contact info securely
  - Handles cases where caller doesn't want to provide info

#### FR-2.3: Lead Logging
- **Description:** Log all lead information to client-accessible spreadsheet
- **Priority:** High
- **Acceptance Criteria:**
  - Creates new row in Google Sheets for each lead
  - Includes: Name, Phone, Email, Service Needed, Problem Description, Appointment Time, Call Date/Time
  - Updates in real-time (within 30 seconds of call ending)
  - Handles concurrent calls without data loss
  - Maintains data integrity

### 1.3 Appointment Booking

#### FR-3.1: Calendar Integration
- **Description:** Book appointments directly to client's Google Calendar
- **Priority:** Critical
- **Acceptance Criteria:**
  - Integrates with Google Calendar API
  - Checks real-time availability
  - Only offers available time slots
  - Creates calendar event with all details
  - Sets appropriate event duration based on service type

#### FR-3.2: Appointment Scheduling
- **Description:** Schedule in-person visits for qualified leads
- **Priority:** Critical
- **Acceptance Criteria:**
  - Offers multiple time slot options
  - Respects business hours and availability
  - Confirms appointment details with caller
  - Sends calendar invitation to caller (if email provided)
  - Handles timezone differences

#### FR-3.3: Appointment Confirmation
- **Description:** Confirm booking details with caller before ending call
- **Priority:** High
- **Acceptance Criteria:**
  - Repeats: Date, Time, Service, Location
  - Asks caller to confirm
  - Provides confirmation number
  - Explains what to expect at appointment

### 1.4 Client Notifications

#### FR-4.1: SMS Notifications
- **Description:** Send text notifications to client when appointments are booked
- **Priority:** High
- **Acceptance Criteria:**
  - Sends SMS within 1 minute of booking
  - Includes: Lead name, service type, appointment time
  - Includes link to spreadsheet
  - Uses client's preferred phone number
  - Handles SMS delivery failures gracefully

#### FR-4.2: Notification Content
- **Description:** SMS contains actionable information
- **Priority:** Medium
- **Acceptance Criteria:**
  - Lead summary (name, service)
  - Appointment time
  - Direct link to spreadsheet row
  - Option to view call recording/transcript

### 1.5 Appointment Management

#### FR-5.1: Cancellation Handling
- **Description:** Process appointment cancellation requests
- **Priority:** High
- **Acceptance Criteria:**
  - Asks for caller name and phone number
  - Verifies caller has an existing appointment
  - Confirms cancellation details
  - Removes event from Google Calendar
  - Updates spreadsheet with "Cancelled" status
  - Notifies client via SMS

#### FR-5.2: Rescheduling Support
- **Description:** Help callers reschedule existing appointments
- **Priority:** High
- **Acceptance Criteria:**
  - Verifies existing appointment
  - Offers new available time slots
  - Updates Google Calendar
  - Updates spreadsheet
  - Confirms new appointment details
  - Notifies client via SMS

#### FR-5.3: Appointment Verification
- **Description:** Verify caller identity for cancellations/rescheduling
- **Priority:** Critical
- **Acceptance Criteria:**
  - Matches caller info (name + phone) against existing bookings
  - Handles partial matches (e.g., nickname vs full name)
  - Gracefully handles "not found" cases
  - Offers to create new booking if not found

---

## 2. Non-Functional Requirements

### 2.1 Performance

#### NFR-1.1: Response Time
- **Description:** AI must respond quickly to maintain natural conversation
- **Metric:** < 1.5 seconds between caller finishing speaking and AI response
- **Priority:** High

#### NFR-1.2: Call Quality
- **Description:** Audio/video quality must be high
- **Metric:**
  - Audio: 16kHz+ sample rate, < 100ms latency
  - Video: 720p minimum, 30fps
- **Priority:** High

#### NFR-1.3: Concurrent Calls
- **Description:** Handle multiple simultaneous calls
- **Metric:** Support 10+ concurrent calls without degradation
- **Priority:** Medium

#### NFR-1.4: Uptime
- **Description:** System availability
- **Metric:** 99.5% uptime (excludes planned maintenance)
- **Priority:** High

### 2.2 Reliability

#### NFR-2.1: Data Integrity
- **Description:** No data loss for lead information
- **Metric:** 100% of qualified leads must be logged
- **Priority:** Critical

#### NFR-2.2: Calendar Sync Accuracy
- **Description:** Calendar must always reflect actual bookings
- **Metric:** 100% accuracy, zero double-bookings
- **Priority:** Critical

#### NFR-2.3: Graceful Degradation
- **Description:** System continues working if components fail
- **Behavior:**
  - If Google Calendar API down: Collect info, notify manually
  - If SMS service down: Store for retry
  - If Sheets API down: Store locally, sync when available
- **Priority:** High

### 2.3 Usability

#### NFR-3.1: Natural Language
- **Description:** Conversations must feel natural, not robotic
- **Metric:** > 80% caller satisfaction (post-call survey)
- **Priority:** High

#### NFR-3.2: Accent/Dialect Support
- **Description:** Understand various accents and dialects
- **Metric:** Support US, UK, Australian, Canadian English at minimum
- **Priority:** Medium

#### NFR-3.3: Error Recovery
- **Description:** Handle misunderstandings gracefully
- **Behavior:**
  - Ask for clarification politely
  - Offer to repeat information
  - Escalate to human if necessary
- **Priority:** High

### 2.4 Security

#### NFR-4.1: Data Privacy
- **Description:** Protect caller personal information
- **Requirements:**
  - Encrypt data in transit (TLS 1.3)
  - Encrypt data at rest (AES-256)
  - GDPR/CCPA compliant
  - No third-party data sharing without consent
- **Priority:** Critical

#### NFR-4.2: Authentication
- **Description:** Secure access to client data
- **Requirements:**
  - API key authentication for integrations
  - OAuth for Google Calendar/Sheets
  - Rate limiting to prevent abuse
- **Priority:** High

#### NFR-4.3: Call Recording Consent
- **Description:** Compliance with recording laws
- **Requirements:**
  - Announce call recording at start
  - Comply with two-party consent laws
  - Provide opt-out option
- **Priority:** Critical

### 2.5 Scalability

#### NFR-5.1: Multi-Tenant Support
- **Description:** Support multiple businesses on same infrastructure
- **Metric:** Support 100+ businesses without performance degradation
- **Priority:** High

#### NFR-5.2: Horizontal Scaling
- **Description:** Add capacity by adding servers
- **Requirements:**
  - Stateless call handling
  - Load balancing
  - Auto-scaling based on demand
- **Priority:** Medium

### 2.6 Maintainability

#### NFR-6.1: Logging & Monitoring
- **Description:** Track system health and issues
- **Requirements:**
  - Log all calls (metadata + transcript)
  - Real-time error monitoring
  - Performance metrics dashboard
  - Alert on critical failures
- **Priority:** High

#### NFR-6.2: Configuration Management
- **Description:** Easy customization per business
- **Requirements:**
  - Per-client settings (hours, services, greeting)
  - No code changes for configuration updates
  - Version control for configurations
- **Priority:** Medium

---

## 3. System Constraints

### 3.1 Technical Constraints

#### C-1.1: Google Calendar API Limits
- **Constraint:** Google Calendar API has rate limits (1000 requests/100 seconds)
- **Mitigation:** Implement request batching and caching

#### C-1.2: SMS Costs
- **Constraint:** Each SMS notification costs money ($0.01-0.02 per message)
- **Mitigation:** Batch notifications, allow email fallback

#### C-1.3: AI API Latency
- **Constraint:** LLM inference adds 500ms-2s latency
- **Mitigation:** Use streaming responses, optimize prompts, use faster models

### 3.2 Business Constraints

#### C-2.1: Budget
- **Constraint:** Infrastructure costs must be < $500/month for MVP
- **Implication:** Start with managed services (LiveKit, OpenAI) vs self-hosted

#### C-2.2: Time to Market
- **Constraint:** MVP must launch in 3 months
- **Implication:** Use existing tools/APIs, minimize custom development

#### C-2.3: Compliance
- **Constraint:** Must comply with TCPA (telephone regulations)
- **Implication:** Cannot make unsolicited calls, must respect Do Not Call lists

---

## 4. User Stories

### 4.1 Caller (Lead) Perspective

**US-1:** As a caller, I want to speak to someone immediately, so I don't have to leave a voicemail
**Acceptance:** Call is answered within 10 seconds

**US-2:** As a caller, I want to get my questions answered, so I can decide if this business can help me
**Acceptance:** AI answers at least 80% of questions accurately

**US-3:** As a caller, I want to book an appointment easily, so I don't have to call back
**Acceptance:** Appointment booked in < 3 minutes

**US-4:** As a caller, I want to reschedule my appointment, so I don't have to cancel and rebook
**Acceptance:** Rescheduling completed in < 2 minutes

**US-5:** As a caller, I want confirmation of my appointment, so I know it's actually scheduled
**Acceptance:** Confirmation provided verbally + optional email/SMS

### 4.2 Business Owner (Client) Perspective

**US-6:** As a business owner, I want all leads captured automatically, so I don't miss opportunities
**Acceptance:** 100% of calls result in logged lead

**US-7:** As a business owner, I want appointments in my calendar, so I know my schedule
**Acceptance:** Appointments appear in Google Calendar within 30 seconds

**US-8:** As a business owner, I want to be notified of new bookings, so I can prepare
**Acceptance:** SMS sent within 1 minute of booking

**US-9:** As a business owner, I want to review call transcripts, so I can improve my business
**Acceptance:** Transcripts available in spreadsheet + dashboard

**US-10:** As a business owner, I want the AI to sound professional, so it represents my brand well
**Acceptance:** AI uses configurable greeting, tone, and business info

---

## 5. System Integrations

### 5.1 Required Integrations

| Integration | Purpose | API/Service | Priority |
|------------|---------|-------------|----------|
| **Google Calendar** | Appointment booking | Google Calendar API v3 | Critical |
| **Google Sheets** | Lead logging | Google Sheets API v4 | Critical |
| **Twilio/SMS** | Client notifications | Twilio SMS API | High |
| **Speech-to-Text** | Transcribe caller | Deepgram / OpenAI Whisper | Critical |
| **LLM** | Conversation AI | OpenAI GPT-4 / Anthropic Claude | Critical |
| **Text-to-Speech** | AI voice | ElevenLabs / Play.ht | Critical |
| **WebRTC** | Call infrastructure | LiveKit / Daily.co | Critical |

### 5.2 Optional Integrations (Future)

- CRM integration (Salesforce, HubSpot, Loctelli CRM)
- Email notifications (SendGrid)
- Analytics dashboard (custom or Mixpanel)
- Payment processing (Stripe) for deposits

---

## 6. MVP Scope (Phase 1)

### In Scope
✅ Answer incoming calls
✅ Basic conversation (greet, ask questions, provide info)
✅ Collect contact information
✅ Book appointments to Google Calendar
✅ Log leads to Google Sheets
✅ Send SMS notifications to client
✅ Handle simple cancellations

### Out of Scope (Future Phases)
❌ Rescheduling (Phase 2)
❌ Payment collection (Phase 2)
❌ Advanced analytics dashboard (Phase 2)
❌ Multi-language support (Phase 3)
❌ Outbound calling (Phase 3)
❌ Video calls (Phase 3 - start with audio only)

---

## 7. Success Metrics

### 7.1 Technical Metrics
- **Call Answer Rate:** > 95% of calls answered
- **Call Completion Rate:** > 90% of calls completed successfully
- **Booking Conversion:** > 60% of qualified leads book appointment
- **System Uptime:** > 99% availability
- **Response Latency:** < 1.5s average

### 7.2 Business Metrics
- **Client Satisfaction:** > 4.0/5.0 rating
- **Lead Quality:** > 70% of logged leads convert to actual appointments
- **Time Saved:** > 10 hours/week per client saved on phone answering
- **Cost per Call:** < $2.00 per call (all-in costs)

### 7.3 User Experience Metrics
- **Caller Satisfaction:** > 4.0/5.0 rating
- **Call Duration:** < 5 minutes average
- **Misunderstanding Rate:** < 10% of conversations require clarification
- **Abandonment Rate:** < 5% of callers hang up mid-call

---

## 8. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI misunderstands caller | High | Medium | Implement clarification loops, human escalation |
| Double-booking appointments | Critical | Low | Implement calendar locking, transaction safety |
| Call quality issues | High | Medium | Use enterprise WebRTC provider, monitor quality |
| Google API rate limits | Medium | Medium | Implement caching, request batching |
| High cost per call | Medium | High | Optimize AI usage, use cheaper models where possible |
| Data privacy breach | Critical | Low | Encryption, security audits, compliance checks |
| System downtime | High | Low | Redundancy, health checks, auto-recovery |
| Caller doesn't trust AI | Medium | Medium | Professional voice, transparent about being AI |

---

## 9. Future Enhancements

### Phase 2 (3-6 months)
- Appointment rescheduling
- Email notifications alongside SMS
- Basic analytics dashboard
- Payment collection for deposits
- Multi-business support (white-label)

### Phase 3 (6-12 months)
- Video call support (not just audio)
- Multi-language support (Spanish, French)
- Advanced AI training per business
- Outbound reminder calls
- CRM integrations (beyond Google)

### Phase 4 (12+ months)
- Full conversation analytics
- Sentiment analysis
- Predictive scheduling
- Voice cloning (use client's actual voice)
- Mobile app for clients

---

## 10. Technical Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                    Caller (Phone/Browser)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   WebRTC Media Server                        │
│                      (LiveKit/Daily)                         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Orchestration Layer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   STT    │→ │   LLM    │→ │   TTS    │→ │  Audio   │   │
│  │(Deepgram)│  │ (OpenAI) │  │(ElevenLab│  │ Stream   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
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

---

## 11. Appendix

### A. Glossary
- **Lead:** A potential customer who contacts the business
- **Qualified Lead:** A lead who has a legitimate need and contact info
- **Booking:** A scheduled appointment in the calendar
- **Client:** The business owner using this AI receptionist service
- **Caller:** The person calling the business

### B. References
- Google Calendar API: https://developers.google.com/calendar
- Google Sheets API: https://developers.google.com/sheets
- Twilio SMS: https://www.twilio.com/docs/sms
- LiveKit: https://livekit.io/
- OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime
- Deepgram: https://developers.deepgram.com/

### C. Document History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-XX | Loctelli Team | Initial requirements document |

---

**End of Requirements Document**
