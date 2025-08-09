# Business Finder Feature Implementation Plan

## Overview
Add a "Finder" section to the admin dashboard that allows users to search for businesses using multiple data sources and export results in various formats.

## API Integration Strategy

### Primary Data Sources
1. **Google Maps Places API**
   - Free tier: 1,500 requests/day
   - Features: Global coverage, business details, ratings, photos
   - Scaling: Can upgrade to paid tier as needed

2. **Yelp Fusion API**
   - Free tier: 5,000 requests/day
   - Features: Rich business profiles, reviews, categories
   - Coverage: Strong in US markets

3. **OpenStreetMap + Overpass API**
   - Completely free and open-source
   - Features: Community-curated business data
   - Limitations: Less comprehensive than commercial APIs

## Implementation Phases

### Phase 1: Backend Foundation
**Database Schema Design**
- Create `ApiKey` entity for managing service and user API keys
- Add `RateLimit` tracking per user/API combination
- Design `BusinessSearch` entity for search history and caching

**Core Services**
- `GooglePlacesService` - Google Maps Places API integration
- `YelpService` - Yelp Fusion API integration  
- `OpenStreetMapService` - OSM/Overpass API integration
- `BusinessFinderService` - Orchestrates searches across all APIs
- `RateLimitService` - Manages API usage limits and abuse prevention

### Phase 2: API Layer
**Endpoints Design**
- `POST /admin/finder/search` - Execute business search
- `GET /admin/finder/results/:searchId` - Retrieve cached results
- `POST /admin/finder/export` - Export results in specified format
- `GET /admin/finder/api-keys` - Manage API keys
- `PUT /admin/finder/api-keys` - Update user API keys

**Rate Limiting Strategy**
- Per-user limits: 500 combined requests/day (service keys)
- Custom key users: Respect API provider limits
- Abuse detection: Temporary bans for excessive usage
- Grace period: 24-hour cooldown for violations

### Phase 3: Frontend Implementation
**UI Components**
- `FinderDashboard` - Main search interface
- `SearchForm` - Query input with location/category filters
- `ResultsTable` - Display search results with sorting/filtering
- `ExportDialog` - Choose export format and options
- `ApiKeyManager` - Interface for custom API key management

**Search Features**
- Location-based search (address, coordinates, radius)
- Business category filtering
- Multiple format outputs (table view, map view)
- Result pagination and sorting
- Search history and favorites

### Phase 4: Data Export System
**Export Formats**
- CSV: Standard spreadsheet format
- JSON: Structured data for developers
- TXT: Simple text format for easy copying
- PDF: Formatted reports with business details

**Export Options**
- Full results or filtered subsets
- Custom field selection
- Scheduled exports (future enhancement)
- Direct email delivery

## Technical Architecture

### Backend Structure
```
project/src/main-app/modules/admin/
├── finder/
│   ├── controllers/
│   │   └── finder.controller.ts
│   ├── services/
│   │   ├── business-finder.service.ts
│   │   ├── google-places.service.ts
│   │   ├── yelp.service.ts
│   │   ├── openstreetmap.service.ts
│   │   └── rate-limit.service.ts
│   ├── dto/
│   │   ├── search-business.dto.ts
│   │   └── export-results.dto.ts
│   └── entities/
│       ├── api-key.entity.ts
│       ├── business-search.entity.ts
│       └── rate-limit.entity.ts
```

### Frontend Structure
```
my-app/components/admin/finder/
├── FinderDashboard.tsx
├── SearchForm.tsx
├── ResultsTable.tsx
├── ExportDialog.tsx
├── ApiKeyManager.tsx
└── types/
    └── finder.types.ts
```

## Security & Rate Limiting

### API Key Management
- Service-provided keys: Shared across all users with global limits
- User-provided keys: Individual limits based on API provider
- Key validation: Verify API keys before saving
- Secure storage: Encrypted API keys in database

### Abuse Prevention
- Progressive rate limiting: Warnings before restrictions
- IP-based tracking: Prevent circumvention via multiple accounts
- Usage analytics: Monitor patterns for unusual activity
- Appeal system: Allow users to request limit increases

## Data Processing & Caching

### Search Optimization
- Result caching: Store successful searches for 24 hours
- Duplicate detection: Merge results from multiple APIs
- Data enrichment: Combine data from all available sources
- Quality scoring: Rank results by completeness and reliability

### Performance Considerations
- Async processing: Handle API calls concurrently
- Timeout handling: Graceful degradation for slow APIs
- Batch processing: Optimize for bulk searches
- CDN integration: Cache common location queries

## Testing Strategy

### Backend Testing
- Unit tests for all service classes
- Integration tests for API connections
- Rate limiting functionality tests
- Export format validation tests

### Frontend Testing
- Component rendering tests
- User interaction flow tests
- Export functionality tests
- Error handling scenarios

## Deployment & Monitoring

### Environment Configuration
- Separate API keys for dev/staging/production
- Rate limit configuration per environment
- Logging levels and monitoring setup
- Health checks for external API availability

### Success Metrics
- Search completion rate
- Export usage statistics
- API response times
- User satisfaction scores
- Cost per successful search

## Future Enhancements

### Advanced Features
- Bulk search via CSV upload
- Automated lead scoring
- CRM integration for direct lead import
- Custom business categorization
- Geofencing and territory mapping

### API Expansion
- Additional data sources (Foursquare, Facebook Places)
- Social media integration
- Review sentiment analysis
- Competitive analysis tools

This plan provides a comprehensive roadmap for implementing the business finder feature while maintaining system security, performance, and scalability.