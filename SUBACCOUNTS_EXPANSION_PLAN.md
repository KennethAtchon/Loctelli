# SubAccounts Expansion Plan for Loctelli CRM

## 🎯 **Overview**

This document outlines the comprehensive plan to add **SubAccounts** functionality to the Loctelli CRM system. SubAccounts will be created by AdminUsers and will contain Users, Leads, Strategies, and Bookings, while keeping PromptTemplates as global resources.

## 🏗️ **Current System Analysis**

### **Existing Architecture**
- **AdminUsers**: Create and manage regular Users
- **Users**: Individual accounts with their own data (strategies, leads, bookings)
- **Resource Isolation**: Users can only access their own data
- **Global Resources**: PromptTemplates are shared across all users
- **Authorization**: Multi-layer security with JWT, role-based access, and resource-level permissions

### **Current Data Flow**
```
AdminUser → creates → User → owns → Strategies, Leads, Bookings
AdminUser → creates → PromptTemplate (global)
```

## 🎯 **Target Architecture with SubAccounts**

### **New Data Hierarchy**
```
AdminUser → creates → SubAccount → contains → Users → own → Strategies, Leads, Bookings
AdminUser → creates → PromptTemplate (global, shared across all SubAccounts)
```

### **Key Benefits**
- **Multi-tenant Support**: Each SubAccount represents a separate business/client
- **Data Isolation**: Complete separation between SubAccounts
- **Scalable Management**: Admins can manage multiple client organizations
- **Resource Sharing**: Global prompt templates across all SubAccounts
- **Flexible User Management**: Users belong to specific SubAccounts

## 📊 **Database Schema Changes**

### **1. New SubAccount Model**

```prisma
model SubAccount {
  id              Int         @id @default(autoincrement())
  name            String      // SubAccount name (e.g., "Acme Corp", "TechStart Inc")
  description     String?     @db.Text // Optional description
  isActive        Boolean     @default(true)
  settings        Json?       // SubAccount-specific settings
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relationships
  createdByAdminId Int
  createdByAdmin  AdminUser   @relation(fields: [createdByAdminId], references: [id])
  users           User[]      // Users belonging to this SubAccount
  strategies      Strategy[]  // Strategies created within this SubAccount
  leads           Lead[]      // Leads created within this SubAccount
  bookings        Booking[]   // Bookings created within this SubAccount
}
```

### **2. Updated Existing Models**

#### **AdminUser Model**
```prisma
model AdminUser {
  // ... existing fields ...
  subAccounts    SubAccount[] // SubAccounts created by this admin
}
```

#### **User Model**
```prisma
model User {
  // ... existing fields ...
  subAccountId   Int         // Required: User must belong to a SubAccount
  subAccount     SubAccount  @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  // Remove createdByAdminId (now handled through SubAccount)
}
```

#### **Strategy Model**
```prisma
model Strategy {
  // ... existing fields ...
  subAccountId   Int         // Required: Strategy belongs to a SubAccount
  subAccount     SubAccount  @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  // Keep userId for individual user ownership within SubAccount
}
```

#### **Lead Model**
```prisma
model Lead {
  // ... existing fields ...
  subAccountId   Int         // Required: Lead belongs to a SubAccount
  subAccount     SubAccount  @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  // Keep userId for individual user ownership within SubAccount
}
```

#### **Booking Model**
```prisma
model Booking {
  // ... existing fields ...
  subAccountId   Int         // Required: Booking belongs to a SubAccount
  subAccount     SubAccount  @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  // Keep userId for individual user ownership within SubAccount
}
```

#### **PromptTemplate Model**
```prisma
model PromptTemplate {
  // ... existing fields remain unchanged ...
  // No subAccountId - remains global across all SubAccounts
}
```

## 🔧 **Backend Implementation**

### **1. New SubAccount Module**

#### **SubAccount DTOs**
```typescript
// create-subaccount.dto.ts
export class CreateSubAccountDto {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

// update-subaccount.dto.ts
export class UpdateSubAccountDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
}
```

#### **SubAccount Service**
```typescript
@Injectable()
export class SubAccountsService {
  constructor(private prisma: PrismaService) {}

  async create(adminId: number, createSubAccountDto: CreateSubAccountDto) {
    return this.prisma.subAccount.create({
      data: {
        ...createSubAccountDto,
        createdByAdminId: adminId,
      },
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { users: true, strategies: true, leads: true, bookings: true }
        }
      }
    });
  }

  async findAll(adminId: number) {
    return this.prisma.subAccount.findMany({
      where: { createdByAdminId: adminId },
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { users: true, strategies: true, leads: true, bookings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number, adminId: number) {
    const subAccount = await this.prisma.subAccount.findFirst({
      where: { id, createdByAdminId: adminId },
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true
          }
        },
        strategies: {
          select: {
            id: true,
            name: true,
            tag: true,
            tone: true,
            createdAt: true
          }
        },
        leads: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true
          }
        },
        bookings: {
          select: {
            id: true,
            bookingType: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!subAccount) {
      throw new NotFoundException('SubAccount not found');
    }

    return subAccount;
  }

  async update(id: number, adminId: number, updateSubAccountDto: UpdateSubAccountDto) {
    const subAccount = await this.prisma.subAccount.findFirst({
      where: { id, createdByAdminId: adminId }
    });

    if (!subAccount) {
      throw new NotFoundException('SubAccount not found');
    }

    return this.prisma.subAccount.update({
      where: { id },
      data: updateSubAccountDto,
      include: {
        createdByAdmin: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  async remove(id: number, adminId: number) {
    const subAccount = await this.prisma.subAccount.findFirst({
      where: { id, createdByAdminId: adminId }
    });

    if (!subAccount) {
      throw new NotFoundException('SubAccount not found');
    }

    // Cascade delete will handle all related data
    await this.prisma.subAccount.delete({ where: { id } });
    return { message: 'SubAccount deleted successfully' };
  }
}
```

#### **SubAccount Controller**
```typescript
@Controller('admin/subaccounts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SubAccountsController {
  constructor(private readonly subAccountsService: SubAccountsService) {}

  @Post()
  @Roles('admin', 'super_admin')
  @UseGuards(RolesGuard)
  create(@CurrentUser() user, @Body() createSubAccountDto: CreateSubAccountDto) {
    return this.subAccountsService.create(user.userId, createSubAccountDto);
  }

  @Get()
  @Roles('admin', 'super_admin')
  @UseGuards(RolesGuard)
  findAll(@CurrentUser() user) {
    return this.subAccountsService.findAll(user.userId);
  }

  @Get(':id')
  @Roles('admin', 'super_admin')
  @UseGuards(RolesGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.subAccountsService.findOne(id, user.userId);
  }

  @Patch(':id')
  @Roles('admin', 'super_admin')
  @UseGuards(RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user,
    @Body() updateSubAccountDto: UpdateSubAccountDto
  ) {
    return this.subAccountsService.update(id, user.userId, updateSubAccountDto);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @UseGuards(RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user) {
    return this.subAccountsService.remove(id, user.userId);
  }
}
```

### **2. Updated Existing Services**

#### **Users Service Updates**
```typescript
// Updated create method
async create(createUserDto: CreateUserDto, subAccountId: number) {
  const { password, ...userData } = createUserDto;
  const hashedPassword = await bcrypt.hash(password, 12);

  return this.prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      subAccountId, // New required field
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      isActive: true,
      subAccount: {
        select: { id: true, name: true }
      },
      createdAt: true,
      updatedAt: true,
    },
  });
}

// Updated findAll method for SubAccount context
async findAllBySubAccount(subAccountId: number) {
  return this.prisma.user.findMany({
    where: { subAccountId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' }
  });
}
```

#### **Authorization Updates**
```typescript
// New authorization helper
export class SubAccountAuthorizationHelper {
  static async validateSubAccountAccess(
    prisma: PrismaService,
    userId: number,
    subAccountId: number,
    userType: 'admin' | 'user'
  ) {
    if (userType === 'admin') {
      const subAccount = await prisma.subAccount.findFirst({
        where: { id: subAccountId, createdByAdminId: userId }
      });
      if (!subAccount) {
        throw new ForbiddenException('Access denied to SubAccount');
      }
      return subAccount;
    } else {
      const user = await prisma.user.findFirst({
        where: { id: userId, subAccountId }
      });
      if (!user) {
        throw new ForbiddenException('Access denied to SubAccount');
      }
      return user;
    }
  }
}
```

### **3. Updated Existing Controllers**

#### **Strategies Controller**
```typescript
@Controller('strategy')
@UseGuards(JwtAuthGuard)
export class StrategiesController {
  // Updated to include SubAccount context
  @Get()
  findAll(@CurrentUser() user, @Query('subAccountId') subAccountId?: string) {
    if (user.type === 'admin') {
      // Admin can view strategies in their SubAccounts
      const parsedSubAccountId = subAccountId ? parseInt(subAccountId, 10) : undefined;
      return this.strategiesService.findAllByAdmin(user.userId, parsedSubAccountId);
    } else {
      // User can only view strategies in their SubAccount
      return this.strategiesService.findAllByUser(user.userId);
    }
  }

  @Post()
  create(@CurrentUser() user, @Body() createStrategyDto: CreateStrategyDto) {
    if (user.type === 'admin') {
      return this.strategiesService.createByAdmin(user.userId, createStrategyDto);
    } else {
      return this.strategiesService.create(user.userId, createStrategyDto);
    }
  }
}
```

## 🎨 **Frontend Implementation**

### **1. New SubAccount Management Pages**

#### **SubAccounts List Page**
```typescript
// app/admin/(main)/subaccounts/page.tsx
export default function SubAccountsPage() {
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubAccount, setEditingSubAccount] = useState<SubAccount | null>(null);

  const loadSubAccounts = async () => {
    try {
      const data = await api.adminSubAccounts.getAllSubAccounts();
      setSubAccounts(data);
    } catch (error) {
      toast.error('Failed to load SubAccounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubAccount = async (formData: CreateSubAccountDto) => {
    try {
      await api.adminSubAccounts.createSubAccount(formData);
      toast.success('SubAccount created successfully');
      setIsCreateDialogOpen(false);
      loadSubAccounts();
    } catch (error) {
      toast.error('Failed to create SubAccount');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SubAccounts</h1>
          <p className="text-gray-600">Manage client organizations and their data</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create SubAccount
        </Button>
      </div>

      {/* SubAccounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subAccounts.map((subAccount) => (
          <Card key={subAccount.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{subAccount.name}</span>
                <Badge variant={subAccount.isActive ? "default" : "secondary"}>
                  {subAccount.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>{subAccount.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Users:</span> {subAccount._count.users}
                </div>
                <div>
                  <span className="font-medium">Strategies:</span> {subAccount._count.strategies}
                </div>
                <div>
                  <span className="font-medium">Leads:</span> {subAccount._count.leads}
                </div>
                <div>
                  <span className="font-medium">Bookings:</span> {subAccount._count.bookings}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/subaccounts/${subAccount.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(subAccount)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialogs */}
      <CreateSubAccountDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateSubAccount}
      />
      
      <EditSubAccountDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        subAccount={editingSubAccount}
        onSubmit={handleUpdateSubAccount}
      />
    </div>
  );
}
```

#### **SubAccount Detail Page**
```typescript
// app/admin/(main)/subaccounts/[id]/page.tsx
export default function SubAccountDetailPage({ params }: { params: { id: string } }) {
  const [subAccount, setSubAccount] = useState<DetailedSubAccount | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const loadSubAccount = async () => {
    try {
      const data = await api.adminSubAccounts.getSubAccount(parseInt(params.id));
      setSubAccount(data);
    } catch (error) {
      toast.error('Failed to load SubAccount details');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{subAccount?.name}</h1>
          <p className="text-gray-600">{subAccount?.description}</p>
        </div>
        <Badge variant={subAccount?.isActive ? "default" : "secondary"}>
          {subAccount?.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users ({subAccount?._count.users})</TabsTrigger>
          <TabsTrigger value="strategies">Strategies ({subAccount?._count.strategies})</TabsTrigger>
          <TabsTrigger value="leads">Leads ({subAccount?._count.leads})</TabsTrigger>
          <TabsTrigger value="bookings">Bookings ({subAccount?._count.bookings})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SubAccountOverview subAccount={subAccount} />
        </TabsContent>
        
        <TabsContent value="users">
          <SubAccountUsers subAccountId={parseInt(params.id)} />
        </TabsContent>
        
        <TabsContent value="strategies">
          <SubAccountStrategies subAccountId={parseInt(params.id)} />
        </TabsContent>
        
        <TabsContent value="leads">
          <SubAccountLeads subAccountId={parseInt(params.id)} />
        </TabsContent>
        
        <TabsContent value="bookings">
          <SubAccountBookings subAccountId={parseInt(params.id)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### **2. Updated Existing Pages**

#### **Updated User Management**
```typescript
// Updated user creation to include SubAccount selection
const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
const [selectedSubAccountId, setSelectedSubAccountId] = useState<number>(0);

const handleCreateUser = async (formData: CreateUserDto) => {
  try {
    await api.adminAuth.createUser({
      ...formData,
      subAccountId: selectedSubAccountId, // New required field
    });
    toast.success('User created successfully');
  } catch (error) {
    toast.error('Failed to create user');
  }
};

// Add SubAccount selector to user creation form
<div className="space-y-2">
  <Label htmlFor="subAccount">SubAccount *</Label>
  <Select
    value={selectedSubAccountId.toString()}
    onValueChange={(value) => setSelectedSubAccountId(parseInt(value))}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select a SubAccount" />
    </SelectTrigger>
    <SelectContent>
      {subAccounts.map((subAccount) => (
        <SelectItem key={subAccount.id} value={subAccount.id.toString()}>
          {subAccount.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### **3. Updated API Client**

#### **New SubAccount Endpoints**
```typescript
// lib/api/endpoints/admin-subaccounts.ts
export interface SubAccount {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdByAdmin: {
    id: number;
    name: string;
    email: string;
  };
  _count: {
    users: number;
    strategies: number;
    leads: number;
    bookings: number;
  };
}

export interface CreateSubAccountDto {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface UpdateSubAccountDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  settings?: Record<string, any>;
}

export class AdminSubAccountsApi {
  constructor(private client: ApiClient) {}

  async getAllSubAccounts(): Promise<SubAccount[]> {
    return this.client.get('/admin/subaccounts');
  }

  async getSubAccount(id: number): Promise<DetailedSubAccount> {
    return this.client.get(`/admin/subaccounts/${id}`);
  }

  async createSubAccount(data: CreateSubAccountDto): Promise<SubAccount> {
    return this.client.post('/admin/subaccounts', data);
  }

  async updateSubAccount(id: number, data: UpdateSubAccountDto): Promise<SubAccount> {
    return this.client.patch(`/admin/subaccounts/${id}`, data);
  }

  async deleteSubAccount(id: number): Promise<{ message: string }> {
    return this.client.delete(`/admin/subaccounts/${id}`);
  }
}
```

## 🔄 **Migration Strategy**

### **Phase 1: Database Migration**
1. **Create SubAccount table**
2. **Add subAccountId to existing models**
3. **Create default SubAccount for existing data**
4. **Migrate existing users to default SubAccount**

### **Phase 2: Backend Updates**
1. **Implement SubAccount module**
2. **Update existing services with SubAccount context**
3. **Update authorization logic**
4. **Add comprehensive tests**

### **Phase 3: Frontend Updates**
1. **Create SubAccount management pages**
2. **Update existing pages with SubAccount context**
3. **Update API client**
4. **Add SubAccount selection to user creation**

### **Phase 4: Testing & Validation**
1. **Comprehensive testing of all flows**
2. **Data migration validation**
3. **Performance testing**
4. **Security audit**

## 📋 **Migration Scripts**

### **Database Migration**
```sql
-- 1. Create SubAccount table
CREATE TABLE "SubAccount" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByAdminId" INTEGER NOT NULL,
    FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 2. Add subAccountId to existing tables
ALTER TABLE "User" ADD COLUMN "subAccountId" INTEGER;
ALTER TABLE "Strategy" ADD COLUMN "subAccountId" INTEGER;
ALTER TABLE "Lead" ADD COLUMN "subAccountId" INTEGER;
ALTER TABLE "Booking" ADD COLUMN "subAccountId" INTEGER;

-- 3. Create default SubAccount
INSERT INTO "SubAccount" ("name", "description", "isActive", "createdByAdminId", "createdAt", "updatedAt")
SELECT 'Default SubAccount', 'Default SubAccount for existing data', true, 
       (SELECT MIN(id) FROM "AdminUser" WHERE "role" = 'super_admin'),
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
LIMIT 1;

-- 4. Migrate existing data
UPDATE "User" SET "subAccountId" = (SELECT id FROM "SubAccount" WHERE "name" = 'Default SubAccount' LIMIT 1);
UPDATE "Strategy" SET "subAccountId" = (SELECT id FROM "SubAccount" WHERE "name" = 'Default SubAccount' LIMIT 1);
UPDATE "Lead" SET "subAccountId" = (SELECT id FROM "SubAccount" WHERE "name" = 'Default SubAccount' LIMIT 1);
UPDATE "Booking" SET "subAccountId" = (SELECT id FROM "SubAccount" WHERE "name" = 'Default SubAccount' LIMIT 1);

-- 5. Make subAccountId required
ALTER TABLE "User" ALTER COLUMN "subAccountId" SET NOT NULL;
ALTER TABLE "Strategy" ALTER COLUMN "subAccountId" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "subAccountId" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "subAccountId" SET NOT NULL;

-- 6. Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_subAccountId_fkey" 
    FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Strategy" ADD CONSTRAINT "Strategy_subAccountId_fkey" 
    FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_subAccountId_fkey" 
    FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_subAccountId_fkey" 
    FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Remove old createdByAdminId from User (now handled through SubAccount)
ALTER TABLE "User" DROP COLUMN "createdByAdminId";
```

## 🧪 **Testing Strategy**

### **Unit Tests**
- **SubAccount Service**: CRUD operations, authorization
- **Updated Services**: User, Strategy, Lead, Booking services with SubAccount context
- **Authorization**: SubAccount access validation

### **Integration Tests**
- **SubAccount Creation**: Admin creates SubAccount, adds users
- **Data Isolation**: Users can only access their SubAccount data
- **Cross-SubAccount Access**: Verify proper isolation

### **E2E Tests**
- **Complete SubAccount Lifecycle**: Create, manage, delete SubAccount
- **User Management**: Create users within SubAccounts
- **Data Operations**: Strategies, leads, bookings within SubAccount context

## 🔒 **Security Considerations**

### **Authorization Updates**
- **SubAccount Access**: Users can only access data within their SubAccount
- **Admin Permissions**: Admins can only manage SubAccounts they created
- **Cross-SubAccount Isolation**: Complete data separation between SubAccounts

### **Data Protection**
- **Cascade Deletes**: SubAccount deletion removes all related data
- **Audit Trail**: Track SubAccount creation and modifications
- **Access Logging**: Log all SubAccount access attempts

## 📈 **Performance Considerations**

### **Database Optimization**
- **Indexes**: Add indexes on subAccountId columns
- **Query Optimization**: Efficient queries with SubAccount context
- **Caching**: Redis caching for SubAccount data

### **Scalability**
- **Horizontal Scaling**: SubAccount-based data partitioning
- **Resource Limits**: Per-SubAccount resource quotas
- **Monitoring**: SubAccount-specific metrics and alerts

## 🚀 **Deployment Plan**

### **Pre-Deployment**
1. **Backup Database**: Complete backup before migration
2. **Test Migration**: Run migration on staging environment
3. **Performance Testing**: Verify performance with new schema
4. **Rollback Plan**: Prepare rollback procedures

### **Deployment Steps**
1. **Database Migration**: Run migration scripts
2. **Backend Deployment**: Deploy updated backend code
3. **Frontend Deployment**: Deploy updated frontend code
4. **Verification**: Test all functionality post-deployment

### **Post-Deployment**
1. **Monitoring**: Monitor system performance and errors
2. **User Training**: Train admins on new SubAccount features
3. **Documentation**: Update user documentation
4. **Support**: Provide support for SubAccount management

## 📚 **Documentation Updates**

### **API Documentation**
- **New SubAccount Endpoints**: Complete API documentation
- **Updated Endpoints**: Document changes to existing endpoints
- **Authorization**: Updated authorization requirements

### **User Documentation**
- **SubAccount Management**: Admin guide for SubAccount operations
- **User Management**: Updated user creation and management
- **Data Organization**: How data is organized within SubAccounts

### **Developer Documentation**
- **Architecture Changes**: Updated system architecture
- **Migration Guide**: Step-by-step migration instructions
- **Testing Guide**: Updated testing procedures

## 🎯 **Success Metrics**

### **Functional Metrics**
- **SubAccount Creation**: Successful SubAccount creation and management
- **Data Isolation**: Proper data separation between SubAccounts
- **User Management**: Successful user creation within SubAccounts
- **Performance**: Maintained or improved system performance

### **User Experience Metrics**
- **Admin Efficiency**: Faster user and data management
- **Data Organization**: Better data organization and access
- **Scalability**: Support for multiple client organizations

This comprehensive plan provides a roadmap for implementing SubAccounts in the Loctelli CRM system while maintaining data integrity, security, and performance. 