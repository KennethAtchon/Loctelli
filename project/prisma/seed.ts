import { Prismalead } from '@prisma/lead';
import * as bcrypt from 'bcrypt';

const prisma = new Prismalead();

// Get default admin password from environment variable
const getDefaultAdminPassword = (): string => {
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  if (!defaultPassword) {
    throw new Error('DEFAULT_ADMIN_PASSWORD environment variable is required for seeding');
  }
  return defaultPassword;
};

async function main() {
  console.log('Starting database seed...');

  // Check if default prompt template exists
  const existingDefault = await prisma.promptTemplate.findFirst({
    where: { isDefault: true },
  });

  if (!existingDefault) {
    console.log('Creating default prompt template...');
    
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

    // Create default prompt template
    await prisma.promptTemplate.create({
      data: {
        name: 'Default Sales Prompt',
        description: 'Standard conversational AI prompt for sales',
        isActive: true,
        isDefault: true,
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