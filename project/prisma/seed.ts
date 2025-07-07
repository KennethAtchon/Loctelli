import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Get default admin password from environment variable with fallback
const getDefaultAdminPassword = (): string => {
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!defaultPassword) {
    console.warn('DEFAULT_ADMIN_PASSWORD environment variable not found, using fallback password');
    return 'defaultAdmin123!CANTUNA';
  }
  return defaultPassword;
};

async function main() {
  console.log('Starting database seed...');

  // Get the first admin user or create one if none exists
  let adminUser = await prisma.adminUser.findFirst();
  
  if (!adminUser) {
    console.log('No admin user found, creating default admin...');
    const defaultPassword = getDefaultAdminPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    adminUser = await prisma.adminUser.create({
      data: {
        name: 'System Admin',
        email: 'admin@loctelli.com',
        password: hashedPassword,
        role: 'super_admin',
      },
    });
    
    console.log('Default admin created with email: admin@loctelli.com');
    console.log('Default password: ' + defaultPassword);
  }

  // Create default SubAccount if it doesn't exist
  let defaultSubAccount = await prisma.subAccount.findFirst({
    where: { name: 'Default SubAccount' }
  });

  if (!defaultSubAccount) {
    console.log('Creating default SubAccount...');
    defaultSubAccount = await prisma.subAccount.create({
      data: {
        name: 'Default SubAccount',
        description: 'Default SubAccount for new users and existing data',
        isActive: true,
        createdByAdminId: adminUser.id,
      },
    });
    console.log('Default SubAccount created successfully');
  } else {
    console.log('Default SubAccount already exists');
  }

  // Check if any prompt template exists
  const existingTemplate = await prisma.promptTemplate.findFirst();

  if (!existingTemplate) {
    console.log('Creating default prompt template...');
    
    // Create default prompt template
    await prisma.promptTemplate.create({
      data: {
        name: 'Default Sales Prompt',
        description: 'Standard conversational AI prompt for sales',
        isActive: true,
        systemPrompt: 'You are a helpful and conversational AI assistant representing the company owner. Your role is to engage in natural conversations with potential leads, answer their questions, and help them with their needs. Be friendly, professional, and genuinely helpful. Respond directly to what the lead is asking or saying. Keep responses concise but informative. If the lead shows interest in services, you can gently guide the conversation toward understanding their needs and offering relevant solutions.',
        role: 'conversational AI assistant and customer service representative',
        instructions: 'You represent the company owner and are talking to a potential lead. Be conversational and responsive to the lead\'s messages. Answer their questions directly and helpfully. If they ask about your role or capabilities, explain them honestly. If they show interest in services, ask about their specific needs and offer relevant information. Be natural and engaging, not pushy or robotic. Always address the lead by their name when provided. Remember: you work FOR the company owner and are talking TO the lead.',
        bookingInstruction: `If the user agrees to a booking, confirm with a message in the following exact format and always end with the unique marker [BOOKING_CONFIRMATION]:
Great news! Your booking is confirmed. Here are the details:
- Date: {date} (must be in YYYY-MM-DD format, e.g., 2025-05-20)
- Time: {time} (must be in 24-hour format, e.g., 14:30 for 2:30 PM or 09:00 for 9:00 AM)
- Location: {location}
- Subject: {subject}
Thank you for choosing us! [BOOKING_CONFIRMATION]

Replace the placeholders with the actual booking details. 
IMPORTANT: The date must be in YYYY-MM-DD format and time must be in 24-hour format (e.g., 14:30, 09:00). 
Do not include AM/PM, seconds, or timezone information. 
Do not use the [BOOKING_CONFIRMATION] marker unless a booking is truly confirmed.`,
        creativity: 7,
        temperature: 0.7,
        createdByAdminId: adminUser.id,
      },
    });
    
    console.log('Default prompt template created successfully');
  } else {
    console.log('Default prompt template already exists');
  }

  // Create a default user if none exists
  let defaultUser = await prisma.user.findFirst();
  if (!defaultUser) {
    console.log('Creating default user...');
    const defaultPassword = getDefaultAdminPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    defaultUser = await prisma.user.create({
      data: {
        name: 'Default User',
        email: 'user@loctelli.com',
        password: hashedPassword,
        role: 'user',
        company: 'Default Company',
        subAccountId: defaultSubAccount.id,
        createdByAdminId: adminUser.id,
      },
    });
    
    console.log('Default user created with email: user@loctelli.com');
    console.log('Default password: ' + defaultPassword);
  } else {
    console.log('Default user already exists');
  }

  // Create a default strategy if none exists
  const existingStrategy = await prisma.strategy.findFirst();
  if (!existingStrategy) {
    console.log('Creating default strategy...');
    
    const defaultTemplate = await prisma.promptTemplate.findFirst({
      where: { isActive: true }
    });
    
    if (!defaultTemplate) {
      console.log('No active prompt template found, skipping strategy creation');
    } else {
      await prisma.strategy.create({
        data: {
          name: 'Default Sales Strategy',
          tag: 'general',
          tone: 'professional',
          aiInstructions: 'Engage leads professionally and helpfully. Ask qualifying questions to understand their needs.',
          objectionHandling: 'Listen to concerns and address them directly. Offer solutions that match their needs.',
          qualificationPriority: 'budget, timeline, decision_maker',
          creativity: 7,
          aiObjective: 'Qualify leads and guide them toward booking a consultation',
          disqualificationCriteria: 'Not interested, wrong contact, no budget',
          delayMin: 30,
          delayMax: 120,
          userId: defaultUser.id,
          subAccountId: defaultSubAccount.id,
          promptTemplateId: defaultTemplate.id,
        },
      });
      
      console.log('Default strategy created successfully');
    }
  } else {
    console.log('Default strategy already exists');
  }

  // Create a default lead if none exists
  const existingLead = await prisma.lead.findFirst();
  if (!existingLead) {
    console.log('Creating default lead...');
    
    const defaultStrategy = await prisma.strategy.findFirst();
    
    if (!defaultStrategy) {
      console.log('No strategy found, skipping lead creation');
    } else {
      await prisma.lead.create({
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          company: 'Example Corp',
          position: 'Manager',
          customId: 'LEAD001',
          status: 'lead',
          notes: 'Sample lead for testing purposes',
          userId: defaultUser.id,
          strategyId: defaultStrategy.id,
          subAccountId: defaultSubAccount.id,
        },
      });
      
      console.log('Default lead created successfully');
    }
  } else {
    console.log('Default lead already exists');
  }

  console.log('Database seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 