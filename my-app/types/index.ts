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
  strategies?: Strategy[];
  clients?: Client[];
  bookings?: Booking[];
}

// Strategy types
export interface Strategy {
  id: number;
  userId: number;
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
  clients?: Client[];
}

// Client types (belong to Users)
export interface Client {
  id: number;
  userId: number;
  strategyId: number;
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
  clientId?: number;
  bookingType: string;
  details: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  client?: Client;
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
}

export interface CreateStrategyDto {
  userId: number;
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

export interface CreateClientDto {
  userId: number;
  strategyId: number;
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
  clientId?: number;
  bookingType: string;
  details: any;
  status?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  clientId: number;
  message: string;
  sender: 'user' | 'client';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

export interface SendMessageDto {
  clientId: number;
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
  totalClients: number;
  totalStrategies: number;
  totalBookings: number;
  recentBookings: Booking[];
  topStrategies: Strategy[];
} 