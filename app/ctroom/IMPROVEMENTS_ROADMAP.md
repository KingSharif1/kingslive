# Ctroom Improvements Roadmap

## 1. ✅ Tasks Section - COMPLETED
- [x] Rename "Projects" to "Categories" 
- [x] Update DEFAULT_PROJECTS to DEFAULT_CATEGORIES
- [ ] Ensure completed tasks show in filters (verify filtering logic)

## 2. Ideas Section - Rich Text Editor Improvements

### Current Issues:
- Cannot insert images
- Cannot insert links
- No voice notes support
- Three-dot menu doesn't work
- No auto-save functionality

### Required Features:
1. **Image Upload**
   - Drag & drop images
   - Paste images from clipboard
   - Upload button
   - Store in Supabase Storage

2. **Link Insertion**
   - URL input dialog
   - Auto-detect URLs and make clickable
   - Link preview cards

3. **Voice Notes**
   - Record audio button
   - Web Audio API integration
   - Store audio files in Supabase Storage
   - Playback controls

4. **Auto-Save**
   - Debounced auto-save (save 2 seconds after typing stops)
   - Visual indicator showing "Saving..." / "Saved"
   - Save draft to localStorage as backup

5. **Three-Dot Menu**
   - Delete idea
   - Duplicate idea
   - Export as markdown
   - Share idea

### Implementation:
- Use BlockNote editor (already in use)
- Add custom slash commands for images/voice
- Integrate Supabase Storage for media files

## 3. Blog Section - Comment Management

### Required Features:
1. **Comment Approval UI**
   - List of pending comments
   - Approve/Reject buttons
   - Bulk actions
   - Comment preview

2. **Data Integration**
   - Fetch posts from Sanity CMS
   - Fetch comments from Supabase `blog_comments` table
   - Fetch view counts from Supabase `blog_post_analytics` table
   - Real-time comment notifications

### Implementation:
- Create CommentsManagementView component
- Add to BlogView as expandable section
- Use Supabase realtime subscriptions for new comments

## 4. Settings - API Keys & Integrations

### Current Issues:
- Cannot see actual API keys (only masked)
- Cannot add multiple API keys for same provider
- No GitHub connection

### Required Features:
1. **API Key Management**
   - Show/hide toggle for each key
   - Add multiple keys per provider (OpenAI, Google, etc.)
   - Set primary/default key
   - Key validation on save
   - Store in Supabase `user_settings` table

2. **GitHub Connection**
   - OAuth integration
   - Connect GitHub account
   - Show connected status
   - Sync repos/gists (future feature)

3. **Key Storage Structure**
```json
{
  "apiKeys": {
    "openai": [
      { "id": "1", "name": "Personal", "key": "sk-...", "isPrimary": true },
      { "id": "2", "name": "Work", "key": "sk-...", "isPrimary": false }
    ],
    "google": [
      { "id": "1", "name": "Default", "key": "AIza...", "isPrimary": true }
    ]
  }
}
```

## 5. Token Usage Widget - Real API Integration

### Current Status:
- Shows hardcoded 0 tokens
- No real usage data

### Required Features:
1. **OpenAI Usage Tracking**
   - Cannot fetch directly from OpenAI API (no usage endpoint)
   - Track usage in app via `/api/chat` route
   - Store in Supabase `token_usage` table
   - Manual quota input (user enters purchased amount)
   - Calculate: REMAINING = PURCHASED - USED

2. **Google Gemini Usage Tracking**
   - Same approach as OpenAI
   - Track in app, store in database
   - Manual quota management

3. **Display Format**
```
OpenAI: 45,230 / 1,000,000 tokens
Remaining: 954,770 (95.5%)
[████████████████████░░] 

Google: 12,450 / 500,000 tokens
Remaining: 487,550 (97.5%)
[█████████████████████░]
```

### Implementation:
- Update `/api/chat/route.ts` to track tokens
- Add quota management to Settings
- Update UsageWidget to show real data
- Add low quota alerts (< 20%)

## 6. Chat/AI Integration - Better UI

### Current Issues:
- AI responses feel disconnected
- No typing indicators
- No streaming responses
- Basic message bubbles

### Required Features:
1. **Improved Message UI**
   - Typing indicator with animated dots
   - Streaming text (word-by-word display)
   - Code syntax highlighting
   - Message reactions/feedback
   - Copy code button

2. **Better Integration**
   - Smooth animations
   - Message grouping by time
   - Avatar for AI assistant
   - Timestamp on hover
   - Edit/regenerate buttons

3. **Mobile Optimization**
   - Swipe gestures
   - Voice input button
   - Better keyboard handling
   - Optimized for thumb reach

## Implementation Priority

### Phase 1 (High Priority)
1. ✅ Tasks: Rename to Categories
2. Blog: Add comment approval UI
3. Token Usage: Real data tracking
4. Settings: Multiple API keys support

### Phase 2 (Medium Priority)
1. Ideas: Image upload
2. Ideas: Auto-save
3. Chat: Better UI/animations
4. Settings: GitHub connection

### Phase 3 (Low Priority)
1. Ideas: Voice notes
2. Ideas: Link previews
3. Chat: Message reactions
4. Advanced analytics

## Database Schema Updates Needed

### 1. Update `user_settings` table:
```sql
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS api_keys JSONB DEFAULT '{"openai": [], "google": [], "github": []}'::jsonb,
ADD COLUMN IF NOT EXISTS token_quotas JSONB DEFAULT '{"openai_purchased": 0, "google_purchased": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS github_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS github_username TEXT;
```

### 2. Create `idea_attachments` table:
```sql
CREATE TABLE idea_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'image', 'audio', 'link'
  url TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Update `token_usage` table (already exists):
- Already has: user_id, provider, model, tokens, request_type, created_at
- Good to go!

## Files to Create/Update

### New Files:
1. `app/ctroom/components/views/CommentsManagementView.tsx`
2. `app/ctroom/components/modals/ApiKeyModal.tsx`
3. `app/ctroom/components/modals/ImageUploadModal.tsx`
4. `app/ctroom/components/modals/VoiceRecorderModal.tsx`
5. `app/ctroom/hooks/useAutoSave.ts`
6. `app/ctroom/hooks/useTokenTracking.ts`

### Update Files:
1. `app/ctroom/components/views/IdeasView.tsx` - Add media support
2. `app/ctroom/components/views/BlogView.tsx` - Add comment management
3. `app/ctroom/components/views/SettingsView.tsx` - Multiple API keys
4. `app/ctroom/components/views/ChatView.tsx` - Better UI
5. `app/ctroom/components/layout/UsageWidget.tsx` - Real data
6. `app/api/chat/route.ts` - Token tracking
7. `app/ctroom/services/ctroomDataService.ts` - New methods
8. `app/ctroom/database/schema.sql` - Schema updates
