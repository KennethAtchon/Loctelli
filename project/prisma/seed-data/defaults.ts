export const DEFAULT_ADMIN_DATA = {
  name: 'System Admin',
  email: 'admin@loctelli.com',
  role: 'super_admin' as const,
};

// Generate default booking availability for the next 7 days
const generateDefaultBookingsTime = () => {
  const bookingsTime: Array<{ date: string; slots: string[] }> = [];
  const today = new Date();

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Generate business hours (9 AM to 5 PM, 30-minute intervals)
    const slots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    bookingsTime.push({
      date: dateStr,
      slots: slots
    });
  }

  return bookingsTime;
};

export const DEFAULT_USER_DATA = [
  {
    name: 'John Sales',
    email: 'john.sales@loctelli.com',
    role: 'user' as const,
    company: 'Loctelli Sales Team',
    bookingEnabled: 1,
    bookingsTime: generateDefaultBookingsTime(),
  },
  {
    name: 'Sarah Support',
    email: 'sarah.support@loctelli.com',
    role: 'user' as const,
    company: 'Loctelli Support Team',
    bookingEnabled: 1,
    bookingsTime: generateDefaultBookingsTime(),
  }
];

export const DEFAULT_SUBACCOUNT_DATA = {
  name: 'Default SubAccount',
  description: 'Default SubAccount for new users and existing data',
  isActive: true,
};

export const DEFAULT_PROMPT_TEMPLATE_DATA = {
  name: 'Default Sales Prompt',
  description: 'Standard conversational AI prompt for sales',
  isActive: true,
  systemPrompt: 'You are a proactive sales representative working for the company owner. Your primary mission is to QUALIFY leads and CLOSE qualified prospects. You must actively guide every conversation with a clear sales process: 1) Build rapport, 2) Qualify the lead (budget, needs, decision-making authority, timeline), 3) Present solutions for qualified leads, 4) Close with a meeting/next step. Take control of conversations - don\'t just respond passively. Ask strategic questions to uncover pain points and buying intent. Be friendly but purposeful.',
  role: 'conversational AI assistant and customer service representative',
  instructions: 'SALES PROCESS - Follow this framework: 1) RAPPORT: Start warm, use their name, ask how they\'re doing. 2) QUALIFY: Ask about their business, current challenges, budget range, decision-making process, and timeline. Use questions like "What\'s your biggest challenge with [relevant area]?" "What\'s your budget range for solving this?" "Who else is involved in making this decision?" 3) PRESENT: Only for qualified leads - present relevant solutions that match their needs and budget. 4) CLOSE: Always end qualified conversations with a meeting request. Be direct: "Based on what you\'ve shared, I think we can help. When would you be available for a 15-minute call to discuss this further?" Remember: You control the conversation flow. Don\'t just answer questions - guide toward qualification and closing.',
  bookingInstruction: `CLOSING QUALIFIED LEADS: You have booking tools to close deals immediately. When a lead is QUALIFIED (has budget, need, authority, timeline), be direct and assumptive in your close:

CLOSING SCRIPTS:
- "Perfect! Based on everything you've shared, I can help you solve this. Let me check my calendar for this week."
- "I have exactly what you need. Are you available Tuesday at 2 PM or Thursday at 3 PM?"
- "Let's get this moving for you. I can do Monday morning or Wednesday afternoon - which works better?"

BOOKING PROCESS:
1. Use check_availability tool to find open slots
2. Present 2-3 specific options (day/time)
3. Once they choose, use book_meeting tool immediately
4. Confirm the booking: "Perfect! I've got you scheduled for [day] at [time]. You'll receive a confirmation shortly."

Be assumptive - don't ask IF they want to meet, ask WHEN they can meet. Strike while the iron is hot!`,
  temperature: 0.7,
};

export const DEFAULT_STRATEGY_DATA = [
  {
    name: 'Professional Sales Strategy',
    tag: 'sales',
    tone: 'professional',
    aiInstructions: 'Your name is Lisa. Engage leads professionally and helpfully. Ask qualifying questions to understand their needs and budget.',
    objectionHandling: 'Listen to concerns and address them directly. Offer solutions that match their needs.',
    qualificationPriority: 'budget, timeline, decision_maker',
    aiObjective: 'Qualify leads and guide them toward booking a consultation',
    disqualificationCriteria: 'Not interested, wrong contact, no budget',
    delayMin: 30,
    delayMax: 120,
  },
  {
    name: 'Friendly Follow-up Strategy',
    tag: 'follow-up',
    tone: 'friendly',
    aiInstructions: 'Follow up with warm leads in a friendly, conversational manner. Build rapport and check on their progress.',
    objectionHandling: 'Be understanding and offer flexible solutions. Focus on building trust.',
    qualificationPriority: 'interest_level, timeline, fit',
    aiObjective: 'Re-engage previous leads and move them through the sales funnel',
    disqualificationCriteria: 'Explicitly asked not to contact, competitor, not a fit',
    delayMin: 60,
    delayMax: 180,
  },
  {
    name: 'Support & Onboarding Strategy',
    tag: 'support',
    tone: 'helpful',
    aiInstructions: 'Provide excellent customer support and guide new customers through onboarding process.',
    objectionHandling: 'Address technical concerns with patience. Offer step-by-step guidance.',
    qualificationPriority: 'support_level, urgency, complexity',
    aiObjective: 'Ensure customer success and satisfaction during onboarding',
    disqualificationCriteria: 'Requires escalation to human support, outside scope',
    delayMin: 15,
    delayMax: 60,
  }
];

export const DEFAULT_LEAD_DATA = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Example Corp',
  position: 'Manager',
  customId: 'LEAD001',
  status: 'lead',
  notes: 'Sample lead for testing purposes',
};

export const DEFAULT_INTEGRATION_TEMPLATES = [
  {
    name: 'GoHighLevel',
    displayName: 'GoHighLevel CRM',
    description: 'Connect your GoHighLevel account to sync contacts, leads, and bookings',
    category: 'CRM',
    icon: 'gohighlevel',
    isActive: true,
    configSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          title: 'API Key',
          description: 'Your GoHighLevel API key'
        },
        locationId: {
          type: 'string',
          title: 'Location ID (Subaccount)',
          description: 'Your GoHighLevel location/subaccount ID. This is used to identify which GHL subaccount this integration belongs to.'
        },
        calendarId: {
          type: 'string',
          title: 'Calendar ID',
          description: 'Calendar ID for booking integration'
        },
        webhookUrl: {
          type: 'string',
          title: 'Webhook URL',
          description: 'Webhook URL for real-time updates'
        }
      },
      required: ['apiKey', 'locationId']
    },
    setupInstructions: `## GoHighLevel Setup Instructions

1. **Get Your API Key**
   - Log into your GoHighLevel account
   - Go to Settings > API
   - Generate a new API key
   - Copy the API key

2. **Find Your Location ID (Subaccount)**
   - Go to Settings > Locations
   - Copy the Location ID for your primary location/subaccount
   - This ID is used to match webhook events to the correct user in Loctelli

3. **Optional: Calendar ID**
   - Go to Calendar settings
   - Copy the Calendar ID if you want booking integration

4. **Configure Webhooks**
   - Set up webhooks in GoHighLevel to point to your Loctelli webhook endpoint`,
    apiVersion: 'v1',
  },
  {
    name: 'FacebookAds',
    displayName: 'Facebook Advertising',
    description: 'Connect your Facebook Ads account to track campaigns and leads',
    category: 'Advertising',
    icon: 'facebook',
    isActive: true,
    configSchema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          title: 'Access Token',
          description: 'Facebook App access token'
        },
        adAccountId: {
          type: 'string',
          title: 'Ad Account ID',
          description: 'Facebook Ad Account ID'
        },
        pageId: {
          type: 'string',
          title: 'Page ID',
          description: 'Facebook Page ID for messaging'
        }
      },
      required: ['accessToken', 'adAccountId']
    },
    setupInstructions: `## Facebook Ads Setup Instructions

1. **Create Facebook App**
   - Go to developers.facebook.com
   - Create a new app or use existing one
   - Add Facebook Login and Marketing API permissions

2. **Get Access Token**
   - Generate a user access token with required permissions
   - Ensure it has ads_management and pages_read_engagement permissions

3. **Find Ad Account ID**
   - Go to Facebook Ads Manager
   - Copy your Ad Account ID from the URL or settings

4. **Optional: Page ID**
   - If you want messaging integration, add your Facebook Page ID`,
    apiVersion: 'v18.0',
  },
  {
    name: 'GoogleAnalytics',
    displayName: 'Google Analytics',
    description: 'Connect your Google Analytics account to track website performance',
    category: 'Analytics',
    icon: 'google-analytics',
    isActive: true,
    configSchema: {
      type: 'object',
      properties: {
        serviceAccountKey: {
          type: 'string',
          title: 'Service Account Key',
          description: 'Google Service Account JSON key'
        },
        propertyId: {
          type: 'string',
          title: 'Property ID',
          description: 'Google Analytics Property ID'
        }
      },
      required: ['serviceAccountKey', 'propertyId']
    },
    setupInstructions: `## Google Analytics Setup Instructions

1. **Create Service Account**
   - Go to Google Cloud Console
   - Create a new project or select existing one
   - Enable Google Analytics API
   - Create a service account and download JSON key

2. **Grant Permissions**
   - Add the service account email to your Google Analytics property
   - Grant "Viewer" or "Editor" permissions

3. **Find Property ID**
   - In Google Analytics, go to Admin
   - Copy the Property ID (format: GA4-XXXXXXXXX)

4. **Upload Service Account Key**
   - Copy the entire JSON content from your service account key file`,
    apiVersion: 'v1beta',
  },
]; 