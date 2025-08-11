# Business Finder Configuration Enhancement Plan

## Current Status
- Google Places API integration working (pending API key configuration)
- Basic search functionality with query, location, radius, sources
- Results limit and category filtering exist in backend DTO but need frontend verification

## Immediate Tasks

### 1. Verify Existing Features Work
- [ ] **Results limit** - Test that `limit` parameter from frontend actually limits results
- [ ] **Category filter** - Test that `category` parameter filters results correctly
- [ ] **Radius filter** - Verify radius filtering works as expected

### 2. Add Business Filtering Options

#### Missing Website Filter
- [ ] Add `searchWithoutWebsite` boolean field to search DTO
- [ ] Backend: Filter results to exclude/include businesses with websites
- [ ] Frontend: Add toggle for "Only show businesses without websites"

#### Contact Information Filters
- [ ] `searchWithoutPhone` - Find businesses missing phone numbers
- [ ] `searchWithoutEmail` - Find businesses missing email addresses
- [ ] `minRating` - Filter by minimum rating threshold
- [ ] `maxResults` - Hard limit on total results returned

### 3. Advanced Search Configuration

#### Business Status Filters
- [ ] `openNow` - Only show currently open businesses
- [ ] `hasPhotos` - Only businesses with photos available
- [ ] `verifiedOnly` - Only verified business listings

#### Location Intelligence
- [ ] Auto-detect user location (IP-based or browser geolocation)
- [ ] Default radius based on location type (urban vs rural)
- [ ] Multi-location search (search multiple cities at once)

### 4. API Source Management
- [ ] Source priority configuration (try Google first, fallback to Yelp)
- [ ] API key management UI for users
- [ ] Rate limiting per source
- [ ] Cost tracking per API call

### 5. Export & Lead Management
- [ ] Export results to CSV/Excel
- [ ] Save searches as "lead lists" 
- [ ] Bulk import businesses to CRM
- [ ] Schedule recurring searches

## Technical Considerations

### Backend Changes
- Extend `SearchBusinessDto` with new filter fields
- Update Google Places service to handle filtering
- Add post-processing filters for API results
- Implement caching for filtered searches

### Frontend Changes
- Advanced search form with collapsible sections
- Real-time search results preview
- Filter chips/tags for active filters
- Search template saving

### Database Schema
- User search preferences
- Saved search templates
- API usage tracking
- Business lead status tracking

## Questions to Resolve
1. Should filtering happen before or after API calls?
2. How to handle conflicting filters across different APIs?
3. User permission levels for advanced features?
4. Integration with existing CRM lead workflow?

## Future Enhancements
- AI-powered business classification
- Sentiment analysis from reviews
- Competitive analysis features
- Market research capabilities