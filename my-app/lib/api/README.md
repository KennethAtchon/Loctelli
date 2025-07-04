# API Client Documentation

This directory contains a modular API client for communicating with the NestJS backend.

## Structure

```
lib/api/
├── client.ts           # Base API client class
├── types.ts            # API-specific types and interfaces
├── index.ts            # Main API client that combines all endpoints
└── endpoints/          # Individual endpoint modules
    ├── users.ts        # User management endpoints
    ├── clients.ts      # Client management endpoints
    ├── strategies.ts   # Strategy management endpoints
    ├── bookings.ts     # Booking management endpoints
    ├── chat.ts         # Chat functionality endpoints
    └── status.ts       # System status endpoints
```

## Usage

### Basic Usage

```typescript
import { api } from '@/lib/api';

// Get all users
const users = await api.users.getUsers();

// Create a new client
const newClient = await api.clients.createClient({
  userId: 1,
  strategyId: 1,
  name: 'John Doe',
  email: 'john@example.com',
});

// Get chat history for a client
const messages = await api.chat.getChatHistory(123);
```

### Individual API Usage

```typescript
import { UsersApi, ClientsApi } from '@/lib/api';

const usersApi = new UsersApi();
const clientsApi = new ClientsApi();

// Use individual APIs
const user = await usersApi.getUser(1);
const clients = await clientsApi.getClientsByUser(1);
```

### Error Handling

```typescript
import { api } from '@/lib/api';

try {
  const users = await api.users.getUsers();
} catch (error) {
  console.error('Failed to fetch users:', error.message);
}
```

### Custom Base URL

```typescript
import { Api } from '@/lib/api';

const customApi = new Api('https://api.example.com');
const users = await customApi.users.getUsers();
```

## Available Endpoints

### Users API
- `getUsers()` - Get all users
- `getUser(id)` - Get user by ID
- `createUser(data)` - Create new user
- `updateUser(id, data)` - Update user
- `deleteUser(id)` - Delete user

### Clients API
- `getClients()` - Get all clients
- `getClient(id)` - Get client by ID
- `createClient(data)` - Create new client
- `updateClient(id, data)` - Update client
- `deleteClient(id)` - Delete client
- `getClientsByUser(userId)` - Get clients by user
- `getClientsByStrategy(strategyId)` - Get clients by strategy

### Strategies API
- `getStrategies()` - Get all strategies
- `getStrategy(id)` - Get strategy by ID
- `createStrategy(data)` - Create new strategy
- `updateStrategy(id, data)` - Update strategy
- `deleteStrategy(id)` - Delete strategy
- `getStrategiesByUser(userId)` - Get strategies by user
- `duplicateStrategy(id)` - Duplicate strategy

### Bookings API
- `getBookings()` - Get all bookings
- `getBooking(id)` - Get booking by ID
- `createBooking(data)` - Create new booking
- `updateBooking(id, data)` - Update booking
- `deleteBooking(id)` - Delete booking
- `getBookingsByUser(userId)` - Get bookings by user
- `getBookingsByClient(clientId)` - Get bookings by client
- `getBookingsByDateRange(startDate, endDate)` - Get bookings by date range
- `updateBookingStatus(id, status)` - Update booking status

### Chat API
- `sendMessage(data)` - Send a message
- `getChatHistory(clientId)` - Get chat history
- `getChatHistoryByDateRange(clientId, startDate, endDate)` - Get chat history by date range
- `markMessageAsRead(messageId)` - Mark message as read
- `deleteMessage(messageId)` - Delete message
- `getUnreadMessagesCount(clientId)` - Get unread messages count
- `markAllAsRead(clientId)` - Mark all messages as read

### Status API
- `getStatus()` - Get system status
- `getHealth()` - Get health check
- `getVersion()` - Get API version

## Types

All API methods are fully typed with TypeScript interfaces defined in `types.ts` and `@/types/index.ts`.

## Configuration

The API client uses the following environment variable:
- `NEXT_PUBLIC_API_URL` - Base URL for the API (defaults to `http://localhost:3000`) 