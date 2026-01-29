# PDF Page Caching Implementation

## Current Issue
- PDF pages are re-rendered every time they come back into view
- Preloaded pages don't persist their rendered content
- Navigation causes loading delays

## Solution Plan
- [ ] Update magazine store to include page cache with rendered canvas data
- [ ] Modify PageRenderer to use cached pages when available
- [ ] Implement cache size management (respect MAX_CACHED_PAGES)
- [ ] Update preload mechanism to actually cache rendered content
- [ ] Add cache cleanup on page changes to prevent memory leaks

## Implementation Steps
1. Extend store with page cache state
2. Modify PageRenderer to cache and retrieve rendered canvases
3. Update cache management logic
4. Test the caching behavior
