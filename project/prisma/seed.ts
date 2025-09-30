import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_ADMIN_DATA,
  DEFAULT_USER_DATA,
  DEFAULT_SUBACCOUNT_DATA,
  DEFAULT_PROMPT_TEMPLATE_DATA,
  HOME_REMODELING_PROMPT_TEMPLATE,
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
    console.log('Creating default prompt templates...');

    // Create the default general sales template (active)
    const defaultTemplate = await prisma.promptTemplate.create({
      data: {
        ...DEFAULT_PROMPT_TEMPLATE_DATA,
        createdByAdminId: adminUser.id,
      },
    });

    // Create the home remodeling template (inactive)
    await prisma.promptTemplate.create({
      data: {
        ...HOME_REMODELING_PROMPT_TEMPLATE,
        createdByAdminId: adminUser.id,
      },
    });

    console.log('Default prompt templates created successfully');

    // Assign the default template as active for the default subaccount
    await prisma.subAccountPromptTemplate.create({
      data: {
        subAccountId: defaultSubAccount.id,
        promptTemplateId: defaultTemplate.id,
        isActive: true,
      },
    });

    console.log('Assigned default template as active for default subaccount');
  } else {
    console.log('Default prompt templates already exist');

    // Ensure default subaccount has an active template
    const existingActiveTemplate = await prisma.subAccountPromptTemplate.findFirst({
      where: {
        subAccountId: defaultSubAccount.id,
        isActive: true,
      },
    });

    if (!existingActiveTemplate) {
      // Get first available template and assign it
      const firstTemplate = await prisma.promptTemplate.findFirst();
      if (firstTemplate) {
        await prisma.subAccountPromptTemplate.upsert({
          where: {
            subAccountId_promptTemplateId: {
              subAccountId: defaultSubAccount.id,
              promptTemplateId: firstTemplate.id,
            },
          },
          update: {
            isActive: true,
          },
          create: {
            subAccountId: defaultSubAccount.id,
            promptTemplateId: firstTemplate.id,
            isActive: true,
          },
        });
        console.log('Assigned first available template as active for default subaccount');
      }
    }
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

    // Get the templates to assign to strategies
    const defaultTemplate = await prisma.promptTemplate.findFirst({
      where: { isActive: true }
    });

    const remodelingTemplate = await prisma.promptTemplate.findFirst({
      where: { name: 'Home Remodeling Sales Prompt' }
    });

    if (!defaultTemplate) {
      console.log('No active prompt template found, skipping strategy creation');
    } else {
      for (let i = 0; i < DEFAULT_STRATEGY_DATA.length; i++) {
        const strategyData = DEFAULT_STRATEGY_DATA[i];
        // Assign strategies to different users if available
        const assignedUser = defaultUsers[i % defaultUsers.length] || defaultUsers[0];

        // Choose the appropriate template
        let templateToUse = defaultTemplate;
        if (strategyData.tag === 'remodeling' && remodelingTemplate) {
          templateToUse = remodelingTemplate;
        }

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
              connect: { id: templateToUse.id }
            },
          },
        });
      }
      
      console.log(`Created ${DEFAULT_STRATEGY_DATA.length} default strategies successfully`);
    }
  } else {
    console.log('Default strategies already exist');
  }

  // Create default leads if none exist
  const existingLead = await prisma.lead.findFirst();
  if (!existingLead) {
    console.log('Creating default leads...');

    const strategies = await prisma.strategy.findMany();

    if (strategies.length === 0) {
      console.log('No strategies found, skipping lead creation');
    } else {
      // Create each lead with appropriate strategy
      for (let i = 0; i < DEFAULT_LEAD_DATA.length; i++) {
        const leadData = DEFAULT_LEAD_DATA[i];

        // Assign the home remodeling strategy to Sarah Johnson (second lead)
        // and the general strategy to John Doe (first lead)
        let assignedStrategy = strategies[0]; // Default to first strategy
        if (i === 1) { // Sarah Johnson - home remodeling lead
          const remodelingStrategy = strategies.find(s => s.tag === 'remodeling');
          if (remodelingStrategy) {
            assignedStrategy = remodelingStrategy;
          }
        }

        await prisma.lead.create({
          data: {
            ...leadData,
            regularUser: {
              connect: { id: defaultUsers[0]?.id || defaultUsers[0].id }
            },
            strategy: {
              connect: { id: assignedStrategy.id }
            },
            subAccount: {
              connect: { id: defaultSubAccount.id }
            },
          },
        });
      }

      console.log(`Created ${DEFAULT_LEAD_DATA.length} default leads successfully`);
    }
  } else {
    console.log('Default leads already exist');
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