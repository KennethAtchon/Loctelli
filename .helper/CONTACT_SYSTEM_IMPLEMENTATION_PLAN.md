# Contact System Implementation Plan

## Overview
Implement a comprehensive contact management system that captures leads from the contact form, stores them in the database, sends email notifications, and provides admin panel management for follow-up.

## 1. Database Schema Changes

### 1.1 Contact Submissions Table
```prisma
model ContactSubmission {
  id          String   @id @default(cuid())
  fullName    String
  email       String
  phone       String
  services    String   // JSON string or enum for multiple services
  message     String?  // Optional message field
  source      String   @default("website") // website, landing_page, etc.
  status      ContactStatus @default(NEW)
  priority    Priority @default(MEDIUM)
  
  // Tracking fields
  submittedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt
  followedUpAt DateTime?
  closedAt    DateTime?
  
  // Assignment
  assignedToId String?
  assignedTo   User?   @relation(fields: [assignedToId], references: [id])
  
  // Notes and follow-up
  notes       ContactNote[]
  
  // Multi-tenant support
  subAccountId String
  subAccount   SubAccount @relation(fields: [subAccountId], references: [id])
  
  @@map("contact_submissions")
}

model ContactNote {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  
  // Relations
  contactId String
  contact   ContactSubmission @relation(fields: [contactId], references: [id], onDelete: Cascade)
  
  authorId  String
  author    User @relation(fields: [authorId], references: [id])
  
  @@map("contact_notes")
}

enum ContactStatus {
  NEW
  CONTACTED
  QUALIFIED
  PROPOSAL_SENT
  CLOSED_WON
  CLOSED_LOST
  UNRESPONSIVE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### 1.2 Update User Model
```prisma
// Add to existing User model
model User {
  // ... existing fields
  
  // Contact management
  assignedContacts ContactSubmission[]
  contactNotes     ContactNote[]
}

// Add to existing SubAccount model
model SubAccount {
  // ... existing fields
  
  // Contact management
  contactSubmissions ContactSubmission[]
}
```

## 2. Backend API Implementation

### 2.1 Contact Submission API
**File**: `project/src/main-app/modules/contacts/`

#### DTOs
```typescript
// dto/create-contact-submission.dto.ts
export class CreateContactSubmissionDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  services: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  source?: string = 'website';
}

// dto/update-contact-submission.dto.ts
export class UpdateContactSubmissionDto {
  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  assignedToId?: string;

  @IsDateString()
  @IsOptional()
  followedUpAt?: string;
}

// dto/create-contact-note.dto.ts
export class CreateContactNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  contactId: string;
}
```

#### Service
```typescript
// contacts.service.ts
@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateContactSubmissionDto, subAccountId: string) {
    return this.prisma.contactSubmission.create({
      data: {
        ...data,
        subAccountId,
      },
      include: {
        assignedTo: true,
        subAccount: true,
      },
    });
  }

  async findAll(subAccountId: string, filters?: ContactFiltersDto) {
    return this.prisma.contactSubmission.findMany({
      where: {
        subAccountId,
        status: filters?.status,
        priority: filters?.priority,
        assignedToId: filters?.assignedToId,
      },
      include: {
        assignedTo: true,
        notes: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findOne(id: string, subAccountId: string) {
    return this.prisma.contactSubmission.findUnique({
      where: { id, subAccountId },
      include: {
        assignedTo: true,
        notes: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
        },
        subAccount: true,
      },
    });
  }

  async update(id: string, data: UpdateContactSubmissionDto, subAccountId: string) {
    return this.prisma.contactSubmission.update({
      where: { id, subAccountId },
      data,
      include: {
        assignedTo: true,
        notes: {
          include: { author: true },
        },
      },
    });
  }

  async addNote(data: CreateContactNoteDto, authorId: string) {
    return this.prisma.contactNote.create({
      data: {
        ...data,
        authorId,
      },
      include: { author: true },
    });
  }

  async getStats(subAccountId: string) {
    const [total, newCount, inProgress, closed] = await Promise.all([
      this.prisma.contactSubmission.count({ where: { subAccountId } }),
      this.prisma.contactSubmission.count({ 
        where: { subAccountId, status: 'NEW' } 
      }),
      this.prisma.contactSubmission.count({ 
        where: { 
          subAccountId, 
          status: { in: ['CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'] } 
        } 
      }),
      this.prisma.contactSubmission.count({ 
        where: { 
          subAccountId, 
          status: { in: ['CLOSED_WON', 'CLOSED_LOST'] } 
        } 
      }),
    ]);

    return { total, newCount, inProgress, closed };
  }
}
```

#### Controller
```typescript
// contacts.controller.ts
@Controller('contacts')
@UseGuards(AuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Post()
  @Public() // Allow public access for website form
  async create(@Body() createContactDto: CreateContactSubmissionDto) {
    // For public forms, use default subaccount or extract from domain
    const subAccountId = 'default-subaccount-id';
    
    const contact = await this.contactsService.create(createContactDto, subAccountId);
    
    // Send email notification
    await this.sendEmailNotification(contact);
    
    return contact;
  }

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query() filters: ContactFiltersDto,
  ) {
    return this.contactsService.findAll(user.subAccountId, filters);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.contactsService.getStats(user.subAccountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.findOne(id, user.subAccountId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactSubmissionDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.update(id, updateContactDto, user.subAccountId);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') contactId: string,
    @Body() createNoteDto: CreateContactNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.addNote(
      { ...createNoteDto, contactId },
      user.id,
    );
  }

  private async sendEmailNotification(contact: ContactSubmission) {
    // Implement email sending logic here
    console.log('Sending email notification for contact:', contact.id);
  }
}
```

### 2.2 Email Integration
```typescript
// email/email.service.ts
@Injectable()
export class EmailService {
  async sendContactNotification(contact: ContactSubmission) {
    const serviceLabels = {
      'free-website': 'Free Website',
      'google-reviews': 'Google Reviews System',
      'customer-reactivation': 'Customer Reactivation',
      'lead-generation': 'AI Lead Generation',
      'all-services': 'All Services',
    };

    const emailTemplate = {
      to: 'info@loctelli.com',
      subject: `🔥 New Lead: ${contact.fullName} - ${serviceLabels[contact.services] || contact.services}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Contact Form Submission</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${contact.fullName}</p>
            <p><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
            <p><strong>Phone:</strong> <a href="tel:${contact.phone}">${contact.phone}</a></p>
            <p><strong>Services:</strong> ${serviceLabels[contact.services] || contact.services}</p>
            <p><strong>Submitted:</strong> ${contact.submittedAt.toLocaleString()}</p>
          </div>

          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0;"><strong>⏰ Follow up within 24 hours for best results!</strong></p>
          </div>

          <div style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/admin/contacts/${contact.id}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Admin Panel
            </a>
          </div>
        </div>
      `,
    };

    // Integrate with your email service (SendGrid, SES, etc.)
    return this.sendEmail(emailTemplate);
  }

  private async sendEmail(template: EmailTemplate) {
    // Implementation depends on your email service
    console.log('Email sent:', template.subject);
  }
}
```

## 3. Frontend Admin Panel Implementation

### 3.1 Admin Routes Structure
```
my-app/app/admin/(main)/contacts/
├── page.tsx                 # Contacts list page
├── [id]/
│   ├── page.tsx            # Contact detail page
│   └── edit/
│       └── page.tsx        # Edit contact page
└── components/
    ├── contact-list.tsx
    ├── contact-detail.tsx
    ├── contact-stats.tsx
    ├── contact-filters.tsx
    ├── contact-notes.tsx
    └── assign-contact-dialog.tsx
```

### 3.2 API Client
```typescript
// lib/api/endpoints/contacts.ts
export const contactsAPI = {
  getAll: (filters?: ContactFilters) => 
    apiClient.get('/contacts', { params: filters }),
    
  getById: (id: string) => 
    apiClient.get(`/contacts/${id}`),
    
  update: (id: string, data: UpdateContactData) => 
    apiClient.patch(`/contacts/${id}`, data),
    
  addNote: (contactId: string, content: string) => 
    apiClient.post(`/contacts/${contactId}/notes`, { content }),
    
  getStats: () => 
    apiClient.get('/contacts/stats'),
};
```

### 3.3 Admin Components

#### Contact List Page
```typescript
// app/admin/(main)/contacts/page.tsx
export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contact Management</h1>
      </div>
      
      <ContactStatsCards />
      <ContactFilters />
      <ContactList />
    </div>
  );
}
```

#### Contact Stats Component
```typescript
// components/admin/contacts/contact-stats.tsx
export function ContactStatsCards() {
  const { data: stats } = useQuery(['contact-stats'], contactsAPI.getStats);
  
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <StatsCard title="Total Contacts" value={stats?.total || 0} />
      <StatsCard title="New" value={stats?.newCount || 0} color="blue" />
      <StatsCard title="In Progress" value={stats?.inProgress || 0} color="yellow" />
      <StatsCard title="Closed" value={stats?.closed || 0} color="green" />
    </div>
  );
}
```

#### Contact List Component
```typescript
// components/admin/contacts/contact-list.tsx
export function ContactList() {
  const { data: contacts } = useQuery(['contacts'], contactsAPI.getAll);
  
  const columns = [
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'services', label: 'Services' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'submittedAt', label: 'Submitted' },
    { key: 'actions', label: 'Actions' },
  ];
  
  return (
    <DataTable 
      data={contacts || []}
      columns={columns}
      renderRow={(contact) => (
        <ContactRow key={contact.id} contact={contact} />
      )}
    />
  );
}
```

### 3.4 Contact Detail Page
```typescript
// app/admin/(main)/contacts/[id]/page.tsx
export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const { data: contact } = useQuery(['contact', params.id], 
    () => contactsAPI.getById(params.id)
  );
  
  if (!contact) return <div>Loading...</div>;
  
  return (
    <div className="space-y-6">
      <ContactHeader contact={contact} />
      <div className="grid md:grid-cols-2 gap-6">
        <ContactDetails contact={contact} />
        <ContactNotes contact={contact} />
      </div>
    </div>
  );
}
```

## 4. Frontend Form Updates

### 4.1 Update Contact Form
```typescript
// components/version2/contact-section.tsx - Updates
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitMessage("");

  const formData = new FormData(e.currentTarget);
  const data = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    services: formData.get("services") as string,
    source: 'website',
  };

  try {
    const response = await fetch("/api/proxy/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      setSubmitMessage("Thank you! We'll contact you within 24 hours.");
      (e.target as HTMLFormElement).reset();
      
      // Optional: Track conversion
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'form_submit', {
          event_category: 'Contact',
          event_label: 'Website Contact Form',
        });
      }
    } else {
      const error = await response.json();
      setSubmitMessage(error.message || "Failed to submit form. Please try again.");
    }
  } catch (error) {
    setSubmitMessage("Failed to submit form. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};
```

## 5. Implementation Phases

### Phase 1: Database & Backend (Priority: HIGH)
1. Create Prisma migrations for contact tables
2. Implement contacts service and controller
3. Set up email notifications
4. Test API endpoints

### Phase 2: Admin Panel (Priority: HIGH)
1. Create admin contacts pages
2. Implement contact list and detail views
3. Add filtering and search functionality
4. Create note-taking system

### Phase 3: Essential Features (Priority: MEDIUM)
1. Contact assignment system
2. Basic follow-up tracking
3. Simple export functionality (CSV)
4. Contact status management

## 6. Technical Considerations

### 6.1 Security
- Input validation on all endpoints
- Rate limiting on public contact form
- GDPR compliance for data storage
- Audit logs for contact modifications

### 6.2 Performance
- Database indexing on frequently queried fields
- Pagination for contact lists
- Caching for stats queries
- Background job processing for emails

### 6.3 Testing
- Unit tests for service methods
- Integration tests for API endpoints
- E2E tests for contact form submission
- Admin panel functionality tests

### 6.4 Monitoring
- Error tracking for failed submissions
- Performance monitoring for form responses
- Email delivery tracking

## 7. Configuration

### 7.1 Environment Variables
```bash
# Email Service
EMAIL_SERVICE=sendgrid  # or ses, mailgun
EMAIL_API_KEY=your-api-key
FROM_EMAIL=info@loctelli.com

# Frontend URL for admin links
FRONTEND_URL=https://app.loctelli.com

# Contact Form Settings
CONTACT_RATE_LIMIT=10  # submissions per hour per IP
DEFAULT_SUBACCOUNT_ID=clxxxxxxxx
```

### 7.2 Feature Flags
```typescript
// Simple feature flags
const FEATURES = {
  CONTACT_SYSTEM: true,
  EMAIL_NOTIFICATIONS: true,
  CONTACT_ASSIGNMENT: false,  // Phase 3
};
```

## 8. Success Criteria

### Minimum Viable Product (MVP)
- ✅ Contact forms submit successfully to database
- ✅ Email notifications sent to info@loctelli.com
- ✅ Admin panel shows all contact submissions
- ✅ Basic contact details and status tracking
- ✅ Simple note-taking for follow-ups

This streamlined plan focuses on getting the essential contact form functionality working properly without overengineering the solution.