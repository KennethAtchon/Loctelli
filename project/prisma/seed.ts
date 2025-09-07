import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_ADMIN_DATA,
  DEFAULT_USER_DATA,
  DEFAULT_SUBACCOUNT_DATA,
  DEFAULT_PROMPT_TEMPLATE_DATA,
  DEFAULT_STRATEGY_DATA,
  DEFAULT_LEAD_DATA,
  DEFAULT_INTEGRATION_TEMPLATES,
} from './seed-data/defaults';

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
        ...DEFAULT_ADMIN_DATA,
        password: hashedPassword,
      },
    });
    
    console.log(`Default admin created with email: ${DEFAULT_ADMIN_DATA.email}`);
    console.log('Default password: ' + defaultPassword);
  }

  // Create default SubAccount if it doesn't exist
  let defaultSubAccount = await prisma.subAccount.findFirst({
    where: { name: DEFAULT_SUBACCOUNT_DATA.name }
  });

  if (!defaultSubAccount) {
    console.log('Creating default SubAccount...');
    defaultSubAccount = await prisma.subAccount.create({
      data: {
        ...DEFAULT_SUBACCOUNT_DATA,
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
    
    await prisma.promptTemplate.create({
      data: {
        ...DEFAULT_PROMPT_TEMPLATE_DATA,
        createdByAdminId: adminUser.id,
      },
    });
    
    console.log('Default prompt template created successfully');
  } else {
    console.log('Default prompt template already exists');
  }

  // Check if any integration templates exist
  const existingIntegrationTemplate = await prisma.integrationTemplate.findFirst();

  if (!existingIntegrationTemplate) {
    console.log('Creating default integration templates...');
    
    for (const templateData of DEFAULT_INTEGRATION_TEMPLATES) {
      await prisma.integrationTemplate.create({
        data: {
          ...templateData,
          createdByAdminId: adminUser.id,
        },
      });
    }
    
    console.log('Default integration templates created successfully');
  } else {
    console.log('Default integration templates already exist');
  }

  // Create default users if none exist
  const existingUsers = await prisma.user.findMany();
  const defaultUsers: any[] = [];
  
  if (existingUsers.length === 0) {
    console.log('Creating default users...');
    const defaultPassword = getDefaultAdminPassword();
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    for (const userData of DEFAULT_USER_DATA) {
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          subAccount: {
            connect: { id: defaultSubAccount.id }
          },
          createdByAdmin: {
            connect: { id: adminUser.id }
          },
        },
      });
      defaultUsers.push(user);
      console.log(`Created user with email: ${userData.email}`);
    }
    
    console.log('Default password: ' + defaultPassword);
  } else {
    console.log('Default users already exist');
    // Get existing users for strategy assignment
    defaultUsers.push(...existingUsers.slice(0, 2));
  }

  // Create default strategies if none exist
  const existingStrategies = await prisma.strategy.findMany();
  if (existingStrategies.length === 0) {
    console.log('Creating default strategies...');
    
    const defaultTemplate = await prisma.promptTemplate.findFirst({
      where: { isActive: true }
    });
    
    if (!defaultTemplate) {
      console.log('No active prompt template found, skipping strategy creation');
    } else {
      for (let i = 0; i < DEFAULT_STRATEGY_DATA.length; i++) {
        const strategyData = DEFAULT_STRATEGY_DATA[i];
        // Assign strategies to different users if available
        const assignedUser = defaultUsers[i % defaultUsers.length] || defaultUsers[0];
        
        await prisma.strategy.create({
          data: {
            ...strategyData,
            regularUser: {
              connect: { id: assignedUser.id }
            },
            subAccount: {
              connect: { id: defaultSubAccount.id }
            },
            promptTemplate: {
              connect: { id: defaultTemplate.id }
            },
          },
        });
      }
      
      console.log(`Created ${DEFAULT_STRATEGY_DATA.length} default strategies successfully`);
    }
  } else {
    console.log('Default strategies already exist');
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
          ...DEFAULT_LEAD_DATA,
          regularUser: {
            connect: { id: defaultUsers[0]?.id || defaultUsers[0].id }
          },
          strategy: {
            connect: { id: defaultStrategy.id }
          },
          subAccount: {
            connect: { id: defaultSubAccount.id }
          },
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