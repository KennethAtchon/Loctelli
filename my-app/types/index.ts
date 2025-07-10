// User types (Accounts)
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  company?: string;
  budget?: string;
  bookingsTime?: any;
  bookingEnabled: number;
  calendarId?: string;
  locationId?: string;
  assignedUserId?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  subAccountId: number;
  strategies?: Strategy[];
  leads?: Lead[];
  bookings?: Booking[];
}

// Strategy types
export interface Strategy {
  id: number;
  userId: number;
  subAccountId: number;
  name: string;
  tag?: string;
  tone?: string;
  aiInstructions?: string;
  objectionHandling?: string;
  qualificationPriority?: string;
  creativity?: number;
  aiObjective?: string;
  disqualificationCriteria?: string;
  exampleConversation?: any;
  delayMin?: number;
  delayMax?: number;
  promptTemplateId: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  leads?: Lead[];
}

// Lead types (belong to Users)
export interface Lead {
  id: number;
  userId: number;
  strategyId: number;
  subAccountId: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  customId?: string;
  messageHistory?: any;
  status: string;
  notes?: string;
  lastMessage?: string;
  lastMessageDate?: string;
  user?: User;
  strategy?: Strategy;
  bookings?: Booking[];
}

// Booking types
export interface Booking {
  id: number;
  userId: number;
  leadId?: number;
  subAccountId: number;
  bookingType: string;
  details: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  lead?: Lead;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
  company?: string;
  budget?: string;
  bookingEnabled?: number;
  calendarId?: string;
  locationId?: string;
  assignedUserId?: string;
  subAccountId: number;
}

export interface CreateStrategyDto {
  userId: number;
  subAccountId: number;
  name: string;
  tag?: string;
  tone?: string;
  aiInstructions?: string;
  objectionHandling?: string;
  qualificationPriority?: string;
  creativity?: number;
  aiObjective?: string;
  disqualificationCriteria?: string;
  exampleConversation?: any;
  delayMin?: number;
  delayMax?: number;
  promptTemplateId?: number;
}

export interface CreateLeadDto {
  userId: number;
  strategyId: number;
  subAccountId: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  customId?: string;
  status?: string;
  notes?: string;
  messages?: any;
  lastMessage?: string;
  lastMessageDate?: string;
}

export interface CreateBookingDto {
  userId: number;
  leadId?: number;
  subAccountId: number;
  bookingType: string;
  details: any;
  status?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  leadId: number;
  message: string;
  sender: 'user' | 'lead';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

export interface SendMessageDto {
  leadId: number;
  message: string;
  strategyId?: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  company?: string;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalLeads: number;
  totalStrategies: number;
  totalBookings: number;
  recentBookings: Booking[];
  topStrategies: Strategy[];
}

// GoHighLevel Integration types
export interface GhlIntegrationConfig {
  apiKey: string;
  locationId: string; // GHL Subaccount/Location ID
  calendarId?: string;
  webhookUrl?: string;
}

export interface GhlSubaccount {
  id: string; // This is the locationId used in webhooks
  name: string;
  email?: string;
  companyId?: string;
  address?: string;
  phone?: string;
  website?: string;
  timezone?: string;
  currency?: string;
  isActive?: boolean;
}

export interface GhlContact {
  id: string;
  locationId: string; // GHL Subaccount ID
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GhlMessage {
  contactId: string; // GHL Contact ID (maps to customId in Lead model)
  messageType?: 'SMS' | 'Email' | 'Live Chat' | 'GMB' | 'Call' | 'Voicemail';
  body?: string;
  subject?: string;
  from?: string;
  to?: string;
  direction?: 'inbound' | 'outbound';
  status?: string;
  timestamp?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
} 