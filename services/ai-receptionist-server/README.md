# Loctelli Video Call Server

Backend service powering the `@loctelli/videocall-ai` SDK.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   videocall.loctelli.com                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API Server │  │ Media Server │  │  AI Engine   │      │
│  │   (NestJS)   │  │  (LiveKit)   │  │  (Python)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                   │             │
│         └──────────────────┴───────────────────┘             │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │   Redis     │                          │
│                    │   Queue     │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. API Server (NestJS)
- REST API for call management
- Authentication & authorization
- Webhook handling
- Integration with main CRM

### 2. Media Server (LiveKit)
- WebRTC signaling
- Media routing
- Recording management

### 3. AI Engine
- Speech-to-Text (Deepgram/Whisper)
- LLM processing (OpenAI/Anthropic)
- Text-to-Speech (ElevenLabs)
- Agent orchestration

## Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables

See `.env.example` for required configuration.

## Deployment

Deployed separately at `videocall.loctelli.com`

## Integration with Main CRM

The video call server integrates with the main Loctelli CRM via:
1. REST API calls (fetching lead/strategy data)
2. Webhooks (sending call summaries back)
3. Shared database (optional) or API-only communication

See [integration docs](./docs/INTEGRATION.md) for details.
