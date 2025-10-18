# AI Receptionist SDK - Goal & Purpose

## Overview

The **@loctelli/ai-receptionist** SDK is a **universal AI agent orchestration library** that enables developers to build AI-powered receptionist/calling systems using their own API credentials and infrastructure.

## Core Philosophy

**This SDK is NOT tied to Loctelli's API.** Instead, it's a framework that:
- Accepts the user's own API credentials (Twilio, Google, OpenAI, etc.)
- Orchestrates complex AI interactions and tool calling
- Handles the "glue code" between different services
- Manages conversation state, transcription, and AI decision-making
- Provides a clean, unified interface for building AI agents

## User Journey Example

### The Developer's Goal
A developer wants to build an AI phone receptionist that can:
- Answer incoming calls
- Transcribe conversations in real-time
- Use AI to understand customer needs
- Book appointments in Google Calendar
- Send follow-up SMS via Twilio
- Tweet updates about bookings

### Setup Process

```typescript
import { AIReceptionist } from '@loctelli/ai-receptionist';

// Step 1: Developer provides their own API credentials
const receptionist = new AIReceptionist({
  // Twilio configuration (user's own account)
  twilio: {
    accountSid: 'ACXXXXXXX',
    authToken: 'your-token',
    phoneNumber: '+1234567890'
  },

  // Google APIs configuration (user's own account)
  google: {
    calendar: {
      clientId: 'xxx.apps.googleusercontent.com',
      clientSecret: 'xxx',
      refreshToken: 'xxx',
      calendarId: 'primary'
    },
    sheets: {
      spreadsheetId: 'xxx',
      sheetName: 'Appointments'
    }
  },

  // Twitter API configuration (user's own account)
  twitter: {
    apiKey: 'xxx',
    apiSecret: 'xxx',
    accessToken: 'xxx',
    accessSecret: 'xxx'
  },

  // AI Model configuration (user's choice)
  model: {
    provider: 'openai', // or 'anthropic', 'gemini', etc.
    apiKey: 'sk-xxx',
    model: 'gpt-4',
    temperature: 0.7
  },

  // Agent behavior configuration
  agent: {
    name: 'Sarah',
    role: 'Sales Representative',
    personality: 'friendly and professional',
    instructions: 'You are a receptionist for ACME Corp...',
    tools: ['calendar', 'sms', 'twitter'] // Which integrations to use
  }
});

// Step 2: Start the AI receptionist
await receptionist.start();

// Step 3: SDK handles everything automatically:
// - Receives incoming Twilio calls
// - Transcribes speech in real-time
// - AI processes conversation and decides actions
// - Automatically calls tools (book calendar, send SMS, tweet)
// - Manages conversation flow until completion
```

## What the SDK Handles

### 1. **API Integration Orchestration**
- Connects to user's Twilio account for voice/SMS
- Integrates with user's Google Calendar/Sheets
- Manages user's Twitter/social media APIs
- Works with user's chosen AI model provider (OpenAI, Anthropic, etc.)

### 2. **AI Agent Orchestration**
- Manages conversation state and context
- Handles AI tool/function calling
- Decides when to use which integration (calendar vs SMS vs email)
- Maintains conversation memory and history

### 3. **Real-time Communication Management**
- WebRTC for voice/video calls
- Real-time transcription pipelines
- Speech-to-text and text-to-speech coordination
- Event streaming and webhooks

### 4. **Tool Execution Engine**
- When AI decides to "book an appointment" → calls Google Calendar API
- When AI decides to "send confirmation SMS" → calls Twilio SMS API
- When AI decides to "post update" → calls Twitter API
- All using the user's provided credentials

### 5. **State Management**
- Track active calls/conversations
- Maintain conversation history
- Handle multi-turn interactions
- Manage appointments, bookings, and outcomes

## Key Benefits

### For Developers
✅ **No vendor lock-in** - Use your own API accounts
✅ **Flexible** - Choose your AI provider, phone provider, calendar provider
✅ **Batteries included** - Complex orchestration handled automatically
✅ **Extensible** - Add custom tools and integrations
✅ **Type-safe** - Full TypeScript support

### What Makes This Different
Most AI SDKs either:
- Lock you into their API (e.g., "use our phone service")
- Are too low-level (just a model wrapper)

**This SDK is the middle layer** - it orchestrates multiple services together with AI decision-making, but uses YOUR infrastructure.

## Architecture Philosophy

```
User's Infrastructure
├── Twilio Account (user's)
├── Google Workspace (user's)
├── OpenAI API Key (user's)
├── Twitter Account (user's)
└── Custom APIs (user's)
         ↓
   @loctelli/ai-receptionist SDK
   (Orchestration + AI Logic)
         ↓
   Working AI Receptionist
```

## Use Cases

1. **Small Business Owner**
   - Uses personal Twilio number
   - Connects personal Google Calendar
   - AI answers calls and books appointments

2. **Enterprise Developer**
   - Company's Twilio account
   - Company's Google Workspace
   - Custom CRM integration
   - AI handles customer service calls

3. **SaaS Platform (ai.loctelli.com)**
   - Platform helps users configure their APIs
   - SDK powers the backend orchestration
   - Each customer uses their own credentials

## What This SDK is NOT

❌ Not a backend API service
❌ Not a SaaS platform
❌ Not tied to Loctelli's infrastructure
❌ Not a simple HTTP client wrapper

## What This SDK IS

✅ An AI agent orchestration framework
✅ A multi-service integration library
✅ A tool-calling execution engine
✅ A conversation management system
✅ Provider-agnostic (bring your own APIs)

---

## Summary

**Goal**: Enable any developer to build sophisticated AI receptionist systems using their own API credentials, with all the complex orchestration, AI decision-making, and tool execution handled automatically by the SDK.
