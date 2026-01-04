# Ctroom Improvements - Implementation Summary

## ✅ Completed Improvements

### 1. Tasks Section
- **Renamed "Projects" to "Categories"** ✅
  - Updated sidebar navigation label
  - Updated DEFAULT_PROJECTS to DEFAULT_CATEGORIES
  - All task filtering and organization now uses "Categories" terminology
  - Categories: Inbox, Work Tasks, Study Goals, Travel Plans, Daily To-Dos

### 2. Blog Section - Comment Management
- **Added Comment Approval UI** ✅
  - Click on "Pending Review" stat card to expand comment list
  - Each pending comment shows:
    - Author name and email
    - Comment content (truncated to 3 lines)
    - Post slug it belongs to
    - Timestamp
  - **Approve button** (green checkmark) - Approves comment and makes it visible
  - **Reject button** (red X) - Deletes comment permanently
  - Real-time updates to stats after approval/rejection
  - Data fetched from Supabase `blog_comments` table
  - Posts fetched from Sanity CMS
  - View counts from Supabase `blog_post_analytics` table

## 🚧 In Progress / Pending

### 3. Settings - Multiple API Keys
**Status**: Needs implementation

**What's needed**:
- Allow multiple API keys per provider (OpenAI, Google, etc.)
- Each key should have:
  - Name/label (e.g., "Personal", "Work")
  - The actual key value
  - Primary/default flag
  - Show/hide toggle
- Add GitHub OAuth connection
- Display connected GitHub username

**Current limitation**: Only one key per provider, keys are masked

### 4. Token Usage - Real Data
**Status**: Needs implementation

**The Problem**:
- OpenAI and Google don't provide APIs to check remaining credits
- Currently shows 0 tokens (hardcoded)

**The Solution**:
1. **Manual Quota Input**: You enter how many tokens you purchased
   - Example: "I bought 1,000,000 tokens from OpenAI"
2. **Automatic Usage Tracking**: We track every API call in the app
   - Store in Supabase `token_usage` table
3. **Calculate Remaining**: REMAINING = PURCHASED - USED
   - Display: "45,230 / 1,000,000 tokens (95.5% remaining)"

**Implementation needed**:
- Add quota input fields to Settings
- Update `/api/chat/route.ts` to track token usage
- Update UsageWidget to fetch and display real data
- Add low quota alerts (< 20%)

### 5. Ideas Section - Rich Text Improvements
**Status**: Needs implementation

**Missing features**:
- ❌ Image upload (drag & drop, paste, upload button)
- ❌ Link insertion and preview
- ❌ Voice notes recording
- ❌ Auto-save (save 2 seconds after typing stops)
- ❌ Three-dot menu functionality (currently does nothing)

**What three-dot menu should do**:
- Delete idea
- Duplicate idea
- Export as markdown
- Share idea

### 6. Chat/AI Integration - Better UI
**Status**: Needs implementation

**Improvements needed**:
- Typing indicator with animated dots
- Streaming responses (word-by-word)
- Better message bubbles with animations
- Code syntax highlighting
- Copy code button
- Message reactions
- Edit/regenerate buttons

### 7. Settings - GitHub Connection
**Status**: Needs implementation

**What's needed**:
- "Connect to GitHub" button
- OAuth flow
- Display connected status
- Show GitHub username
- Future: Sync repos/gists

## 📊 Database Schema Updates Needed

### 1. Update `user_settings` table:
```sql
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS api_keys JSONB DEFAULT '{
  "openai": [],
  "google": [],
  "github": []
}'::jsonb,
ADD COLUMN IF NOT EXISTS token_quotas JSONB DEFAULT '{
  "openai_purchased": 0,
  "google_purchased": 0
}'::jsonb,
ADD COLUMN IF NOT EXISTS github_connected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS github_username TEXT;
```

### 2. Create `idea_attachments` table (for images/voice):
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

### 3. Token usage table (already exists):
```sql
-- Already created, ready to use!
CREATE TABLE token_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  request_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎯 Priority Order

### High Priority (Do Next):
1. **Token Usage Real Data** - Most requested feature
   - Add quota inputs to Settings
   - Track usage in `/api/chat/route.ts`
   - Update UsageWidget display

2. **Settings Multiple API Keys** - Important for flexibility
   - Restructure API key storage
   - Add UI for managing multiple keys
   - Add primary/default selection

3. **Ideas Auto-Save** - Prevents data loss
   - Debounced save (2 seconds after typing)
   - Visual "Saving..." indicator
   - localStorage backup

### Medium Priority:
4. **Ideas Three-Dot Menu** - Fix existing broken feature
5. **GitHub Connection** - Nice to have integration
6. **Chat UI Improvements** - Better user experience

### Low Priority:
7. **Ideas Image Upload** - Complex feature
8. **Ideas Voice Notes** - Complex feature
9. **Ideas Link Previews** - Nice to have

## 📝 Files That Need Updates

### For Token Usage:
1. `app/api/chat/route.ts` - Add token tracking
2. `app/ctroom/components/views/SettingsView.tsx` - Add quota inputs
3. `app/ctroom/components/layout/UsageWidget.tsx` - Show real data
4. `app/ctroom/services/ctroomDataService.ts` - Add quota methods

### For Multiple API Keys:
1. `app/ctroom/types/index.ts` - Update UserSettings interface
2. `app/ctroom/components/views/SettingsView.tsx` - New UI
3. `app/ctroom/components/modals/ApiKeyModal.tsx` - New file
4. `app/ctroom/database/schema.sql` - Update schema

### For Ideas Improvements:
1. `app/ctroom/components/views/IdeasView.tsx` - Add auto-save, fix menu
2. `app/ctroom/hooks/useAutoSave.ts` - New custom hook
3. `app/ctroom/components/modals/ImageUploadModal.tsx` - New file
4. `app/ctroom/components/modals/VoiceRecorderModal.tsx` - New file

## 🔧 How to Test Current Changes

1. **Tasks Categories**: 
   - Go to Tasks view
   - Check sidebar shows "Categories" instead of "Projects"
   - Verify filtering works with categories

2. **Blog Comment Management**:
   - Go to Blog view
   - Click on "Pending Review" card (orange one)
   - Should see list of pending comments
   - Click green checkmark to approve
   - Click red X to reject
   - Stats should update immediately

## 💡 Notes on Token Tracking

Since OpenAI and Google don't provide usage APIs, here's how it works:

**For OpenAI**:
- Check your usage at: https://platform.openai.com/usage
- Manually enter your purchased amount in Settings
- We track each API call in the app
- Display: Used / Purchased = Remaining

**For Google Gemini**:
- Check your usage at: https://aistudio.google.com/app/apikey
- Same manual quota system as OpenAI
- Track usage per request
- Display remaining quota

**Why this approach**:
- No official API to check remaining credits
- Most accurate way is to track usage ourselves
- Gives you full control over quota management
- Can set alerts when running low

## 🎨 Mobile Optimization Notes

All improvements should work on mobile:
- Comment approval: Touch-friendly buttons
- Token usage: Responsive layout
- Settings: Mobile-optimized forms
- Ideas: Touch gestures for editing

The app is designed to be "mobile-first" but work great on desktop too.
