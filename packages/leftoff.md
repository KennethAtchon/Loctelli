so my vision is, services will be called by resources, and services will be the one to call orchestrators, does that make sense? can we do like another mini refractor and update architecture md
Absolutely! That makes perfect sense. Let me clarify the architecture: Your Vision:
Resources (user-facing API)
    ↓
Services (business logic layer)
    ↓
Orchestrators (integration layer with external APIs)
This is a much cleaner separation of concerns! Let me refactor to implement this layered architecture.
Update Todos

Understand current services structure

Create service layer for calls (CallsService)

Create service layer for SMS (SMSService)

Create service layer for email (EmailService)

Update ConfigurationManager to provide services instead of orchestrators

Refactor resources to call services instead of orchestrators

Update ARCHITECTURE.md with new layered architecture
Read c:\Users\kenne\Documents\Workplace\Loctelli\packages\ai-receptionist\src\services\index.ts
Globpattern: "**/*.ts"
⎿
Found 4 files
Session limit reached ∙ resets 10pm