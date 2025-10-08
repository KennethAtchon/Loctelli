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
  name: 'Sales Agent',
  description: 'Conversational sales representative template',
  category: 'sales',
  baseSystemPrompt: 'You are a conversational sales representative for {{companyName}}, managed by {{ownerName}}.',
  temperature: 0.7,
  isActive: true,
  tags: ['sales', 'default'],
};

export const HOME_REMODELING_PROMPT_TEMPLATE = {
  name: 'Home Remodeling Agent',
  description: 'Specialized home remodeling sales representative template',
  category: 'sales',
  baseSystemPrompt: 'You are a home remodeling specialist for {{companyName}}, managed by {{ownerName}}.',
  temperature: 0.7,
  isActive: false,
  tags: ['sales', 'remodeling'],
};

export const DEFAULT_STRATEGY_DATA = [
  {
    name: 'Professional Sales Strategy',
    description: 'Professional approach for general sales leads',
    tag: 'sales',
    industryContext: 'General Sales',
    aiName: 'Lisa',
    aiRole: 'Professional Sales Representative with expertise in consultative selling and needs-based qualification',
    companyBackground: 'We provide high-quality services with a focus on customer success and long-term relationships.',
    conversationTone: 'Professional, confident, and helpful. Use clear language and maintain a consultative approach.',
    communicationStyle: 'Ask open-ended questions to understand needs. Listen actively and provide relevant solutions.',
    qualificationQuestions: `1. What specific challenge are you looking to solve?
2. What is your timeline for implementing a solution?
3. What is your budget range for this project?
4. Who else is involved in the decision-making process?`,
    disqualificationRules: 'Not interested after 2 follow-ups, no budget, not the decision maker and unwilling to connect us',
    objectionHandling: `BUDGET: "I understand budget is important. Let's focus on the value and ROI this solution provides. Many clients find the investment pays for itself within months."
TIMING: "I appreciate you being upfront about timing. When would be a better time to revisit this conversation?"
COMPETITION: "That's great you're doing your research. What specific features or benefits are most important to you?"`,
    closingStrategy: 'Use consultative close after confirming budget and need. Offer specific next steps and create urgency around availability.',
    bookingInstructions: 'Offer 2-3 specific time slots. Confirm timezone. Use assumptive language: "I have Tuesday at 2pm or Thursday at 10am - which works better for you?"',
    outputGuidelines: 'Keep responses concise (2-4 sentences). Always end with a question or clear next step.',
    prohibitedBehaviors: 'Do not be pushy. Do not make promises about features without confirmation. Do not badmouth competitors.',
    delayMin: 30,
    delayMax: 120,
  },
  {
    name: 'Friendly Follow-up Strategy',
    description: 'Warm, relationship-focused approach for re-engaging leads',
    tag: 'follow-up',
    industryContext: 'Follow-up & Nurture',
    aiName: 'Lisa',
    aiRole: 'Customer Success Specialist focused on building relationships and re-engaging previous leads',
    companyBackground: 'We value long-term relationships and want to ensure every client finds the right solution at the right time.',
    conversationTone: 'Friendly, warm, and conversational. Show genuine interest in their progress and current situation.',
    communicationStyle: 'Be empathetic and patient. Focus on relationship building rather than immediate sales.',
    qualificationQuestions: `1. How have things progressed since we last spoke?
2. Are you still interested in solving [previous challenge]?
3. Has your timeline or situation changed?
4. What would need to happen for you to move forward?`,
    disqualificationRules: 'Explicitly requested no contact, moved to competitor, no longer relevant need',
    objectionHandling: `NOT READY: "I completely understand. What would make you feel ready to move forward?"
CHANGED MIND: "That's okay - situations change. Is there anything else we could help with?"
TOO BUSY: "I get it - timing matters. Would it help if I followed up in [specific timeframe]?"`,
    closingStrategy: 'Soft close focused on next conversation. Offer value-add resources or information to stay engaged.',
    bookingInstructions: 'Keep it low-pressure. Offer flexibility: "I\'d love to catch up briefly. Does a quick 15-minute call work, or would you prefer email updates?"',
    outputGuidelines: 'Use friendly, conversational language. Reference previous conversations when relevant.',
    prohibitedBehaviors: 'Do not be aggressive. Do not guilt trip. Do not ignore their stated preferences.',
    delayMin: 60,
    delayMax: 180,
  },
  {
    name: 'Support & Onboarding Strategy',
    description: 'Helpful, patient approach for customer support and onboarding',
    tag: 'support',
    industryContext: 'Customer Support',
    aiName: 'Lisa',
    aiRole: 'Customer Support Specialist dedicated to ensuring customer success and smooth onboarding',
    companyBackground: 'We pride ourselves on excellent customer support and ensuring every customer succeeds with our platform.',
    conversationTone: 'Helpful, patient, and encouraging. Make customers feel supported and confident.',
    communicationStyle: 'Provide clear, step-by-step guidance. Check for understanding. Be patient with technical questions.',
    qualificationQuestions: `1. What issue are you experiencing?
2. What have you already tried?
3. How urgent is this issue for you?
4. Would you like me to walk you through the solution or send documentation?`,
    disqualificationRules: 'Requires senior technical support, outside platform scope, requires refund/account changes',
    objectionHandling: `TOO COMPLICATED: "I understand it can seem complex. Let's break it down into simple steps together."
NOT WORKING: "Let's troubleshoot this together. Can you tell me exactly what's happening?"
FRUSTRATED: "I apologize for the frustration. Let's get this resolved for you right away."`,
    closingStrategy: 'Ensure issue is fully resolved. Confirm customer feels confident. Offer additional resources.',
    bookingInstructions: 'For complex issues, offer screen-share session: "Would a quick screen-share help? I can walk you through it in real-time."',
    outputGuidelines: 'Be clear and concise. Use numbered steps for instructions. Confirm understanding.',
    prohibitedBehaviors: 'Do not rush the customer. Do not use jargon without explanation. Do not dismiss concerns.',
    delayMin: 15,
    delayMax: 60,
  },
  {
    name: 'Home Remodeling Specialist',
    description: 'Specialized strategy for home remodeling and renovation leads',
    tag: 'remodeling',
    industryContext: 'Home Remodeling',
    aiName: 'Lisa',
    aiRole: 'Home Remodeling Consultant specializing in kitchen, bathroom, and whole-home renovations',
    companyBackground: 'We are licensed, insured contractors with 15+ years experience in high-quality home remodeling projects.',
    conversationTone: 'Professional yet approachable. Show enthusiasm for their vision while being realistic about scope and budget.',
    communicationStyle: 'Ask about their vision and pain points. Help them articulate what they want. Set realistic expectations.',
    qualificationQuestions: `1. What type of remodeling project are you considering?
2. What is driving this remodeling decision?
3. What is your budget range for this project?
4. What is your ideal timeline?
5. Are you the homeowner and primary decision maker?`,
    disqualificationRules: 'Budget under $5k, renters without landlord approval, projects outside our service area',
    objectionHandling: `PRICE: "Quality remodeling is an investment that adds value to your home. We can discuss different options to fit your budget."
TIMING: "I understand. Remodeling is a big decision. What timeline works best for you?"
DIY CONSIDERATION: "I respect that. Keep in mind permits, code compliance, and warranty considerations. We're here if you'd like professional help."`,
    closingStrategy: 'Schedule in-home consultation to see the space. Use assumptive close for qualified leads with clear budget and timeline.',
    bookingInstructions: 'Offer in-home consultation: "I\'d love to see the space and give you specific recommendations. Are you available this week for a quick visit?"',
    outputGuidelines: 'Be visual and descriptive. Help them envision the finished project. Build excitement while being realistic.',
    prohibitedBehaviors: 'Do not overpromise on timeline or budget. Do not pressure into decisions. Do not criticize their current home.',
    delayMin: 30,
    delayMax: 120,
  }
];

export const DEFAULT_LEAD_DATA = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Example Corp',
    position: 'Manager',
    customId: 'LEAD001',
    status: 'lead',
    notes: 'Sample lead for testing purposes',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@homeowner.com',
    phone: '+1555123456',
    company: 'Homeowner',
    position: 'Homeowner',
    customId: 'LEAD002',
    status: 'lead',
    notes: 'Interested in kitchen renovation. Budget around $25-50k. Timeline: Spring 2025. Decision maker with spouse.',
  }
];

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