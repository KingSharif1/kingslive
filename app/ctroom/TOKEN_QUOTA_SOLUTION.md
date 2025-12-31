# Token Quota & API Key Management Solution

## Your Questions Answered

### 1. **How to Know How Many Tokens You Have Left?**

**Problem**: OpenAI and Google don't provide direct APIs to check your remaining purchased credits/tokens.

**Solution**: We'll use a **manual quota system** where you:
1. Enter how many tokens you purchased (e.g., $100 = ~1M tokens for OpenAI)
2. We track how many you've USED through the app
3. Display: **REMAINING = PURCHASED - USED**

**Example**:
- You bought: 1,000,000 tokens from OpenAI
- You've used: 45,230 tokens (tracked in database)
- **Remaining: 954,770 tokens** ✅

### 2. **Should Users Add Their Own Keys or Use Yours?**

**Best Solution**: **BOTH OPTIONS** 🎯

Give users a choice:
- ✅ **Option A**: Use your default API keys (easier for users)
- ✅ **Option B**: Add their own API keys (they pay for their own usage)

**Benefits**:
- Users without keys can use your credits
- Power users can use their own keys
- You control costs by setting limits on default keys

## Implementation Plan

### Step 1: Update User Settings Schema

Add to `user_settings` table:
```json
{
  "api_keys": {
    "openai": "sk-...",  // Their custom key (optional)
    "google": "AIza...",  // Their custom key (optional)
    "use_custom": true    // Toggle: use custom or default
  },
  "token_quotas": {
    "openai_purchased": 1000000,  // Tokens you bought
    "google_purchased": 500000,   // Tokens you bought
    "openai_used": 45230,         // Tracked automatically
    "google_used": 12450          // Tracked automatically
  }
}
```

### Step 2: Settings Page UI

**API Keys Section**:
```
┌─────────────────────────────────────────┐
│ API Key Configuration                    │
├─────────────────────────────────────────┤
│                                          │
│ ○ Use Default Keys (King's Credits)     │
│   - No setup required                    │
│   - Limited to 10,000 tokens/day         │
│                                          │
│ ● Use My Own Keys                        │
│   - Unlimited usage                      │
│   - You pay for your own API calls       │
│                                          │
│   OpenAI API Key:                        │
│   [sk-proj-••••••••••••••••]  👁️        │
│                                          │
│   Google API Key:                        │
│   [AIza••••••••••••••••••••]  👁️        │
│                                          │
└─────────────────────────────────────────┘
```

**Token Quota Section** (Only visible if using default keys):
```
┌─────────────────────────────────────────┐
│ Token Quota Management                   │
├─────────────────────────────────────────┤
│                                          │
│ OpenAI Credits:                          │
│ Purchased: [1,000,000] tokens            │
│ Used:      45,230 tokens (4.5%)          │
│ Remaining: 954,770 tokens ✅             │
│ [████████████████████░░] 95.5%           │
│                                          │
│ Google Credits:                          │
│ Purchased: [500,000] tokens              │
│ Used:      12,450 tokens (2.5%)          │
│ Remaining: 487,550 tokens ✅             │
│ [█████████████████████░] 97.5%           │
│                                          │
└─────────────────────────────────────────┘
```

### Step 3: Chat API Logic

```typescript
// In /api/chat/route.ts

// 1. Check which keys to use
const userSettings = await getUserSettings(userId);
const useCustomKeys = userSettings?.api_keys?.use_custom;

// 2. Select API key
const openaiKey = useCustomKeys 
  ? userSettings.api_keys.openai 
  : process.env.OPENAI_API_KEY;

// 3. Check quota (only if using default keys)
if (!useCustomKeys) {
  const quota = await checkQuota(userId, 'openai');
  if (quota.remaining <= 0) {
    return error("You've used all available tokens. Please add your own API key in Settings.");
  }
}

// 4. Make API call
const response = await callOpenAI(openaiKey, prompt);

// 5. Track usage
await trackTokenUsage(userId, 'OpenAI', tokensUsed);
```

### Step 4: Usage Widget Display

**Current Display**:
```
Token Usage
45,230 tokens used
```

**New Display**:
```
Token Usage
45,230 / 1,000,000 tokens
954,770 remaining (95.5%)
```

**With Custom Keys**:
```
Token Usage
45,230 tokens used
(Using your API keys)
```

## Database Changes Needed

### Update `user_settings` table:
```sql
-- Add token quota tracking
ALTER TABLE user_settings 
ADD COLUMN token_quotas JSONB DEFAULT '{
  "openai_purchased": 0,
  "google_purchased": 0
}'::jsonb;

-- Update api_keys structure
-- api_keys will now include:
-- { "openai": "key", "google": "key", "use_custom": false }
```

## How Users Will Use It

### Scenario A: New User (No API Keys)
1. Signs up
2. Uses your default keys automatically
3. Limited to daily quota (e.g., 10,000 tokens/day)
4. Sees remaining tokens in sidebar

### Scenario B: Power User (Has API Keys)
1. Goes to Settings → API Keys
2. Selects "Use My Own Keys"
3. Enters their OpenAI/Google keys
4. Gets unlimited usage (they pay)
5. Widget shows "Using your API keys"

### Scenario C: You (Admin)
1. Go to Settings → Token Quotas
2. Enter purchased amounts:
   - OpenAI: 1,000,000 tokens
   - Google: 500,000 tokens
3. System tracks usage automatically
4. See remaining quota in real-time
5. Get alerts when quota is low (< 20%)

## Cost Control Features

### Daily Limits (For Default Keys)
```typescript
const DAILY_LIMITS = {
  free_tier: 1000,      // Free users: 1k tokens/day
  basic_tier: 10000,    // Basic users: 10k tokens/day
  unlimited: Infinity   // Custom key users: unlimited
};
```

### Low Quota Alerts
```typescript
if (remainingTokens < totalTokens * 0.2) {
  showAlert("⚠️ Low on tokens! Only 20% remaining.");
}

if (remainingTokens < totalTokens * 0.1) {
  showAlert("🚨 Critical: Only 10% tokens left!");
}
```

## Next Steps

1. ✅ Fixed data service schema issues
2. ⏳ Add API key toggle to Settings
3. ⏳ Add token quota inputs to Settings
4. ⏳ Update chat API to check which keys to use
5. ⏳ Update UsageWidget to show remaining quota
6. ⏳ Add daily limits for default keys
7. ⏳ Add low quota alerts

## Files to Update

1. `app/ctroom/types/index.ts` - Add quota types
2. `app/ctroom/components/views/SettingsView.tsx` - Add UI
3. `app/api/chat/route.ts` - Add key selection logic
4. `app/ctroom/components/layout/UsageWidget.tsx` - Show remaining
5. `app/ctroom/services/ctroomDataService.ts` - Add quota methods
6. `app/ctroom/database/schema.sql` - Update user_settings

## Summary

**Your Question**: "Is there a way to know how much token I got left?"
**Answer**: Yes! Enter your purchased amount in Settings, we track usage, and show you: REMAINING = PURCHASED - USED

**Your Question**: "Should users add their own key or use the ones already there?"
**Answer**: Both! Give users a choice:
- Use your default keys (easier, but limited)
- Use their own keys (unlimited, they pay)

This gives you cost control while providing flexibility for power users.
