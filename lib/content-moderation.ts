// Content moderation utility with OpenAI integration
// Checks for profanity, hate speech, violence, and suspicious content

// Common profanity words (basic list - fallback if OpenAI unavailable)
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'piss', 'dick', 'cock',
  'pussy', 'asshole', 'bastard', 'slut', 'whore', 'nigger', 'faggot',
  'retard', 'cunt', 'twat', 'wanker', 'bollocks'
]

// Suspicious patterns that might indicate spam or malicious content
const SUSPICIOUS_PATTERNS = [
  /https?:\/\/[^\s]+/gi, // URLs (flag for review, not auto-reject)
  /\b(buy|sell|discount|offer|free|click here|subscribe)\b/gi, // Spam keywords
  /(.)\1{4,}/gi, // Repeated characters (e.g., "hellooooooo")
  /[A-Z]{5,}/g, // Excessive caps
]

export interface ModerationResult {
  isClean: boolean
  hasProfanity: boolean
  hasSuspiciousContent: boolean
  flaggedWords: string[]
  suspiciousMatches: string[]
  shouldAutoApprove: boolean
  confidence: number // 0-1, higher = more confident it's safe
  openAIFlagged?: boolean
  openAICategories?: string[]
}

// OpenAI Moderation API response
interface OpenAIModerationResponse {
  flagged: boolean
  categories?: Record<string, boolean>
  flaggedCategories?: string[]
  categoryScores?: Record<string, number>
  usingFallback?: boolean
  error?: string
}

// Call OpenAI Moderation API
export async function moderateWithOpenAI(text: string): Promise<OpenAIModerationResponse> {
  try {
    const response = await fetch('/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
    
    if (!response.ok) {
      console.error('Moderation API error:', response.status)
      return { flagged: false, error: 'API error' }
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error calling moderation API:', error)
    return { flagged: false, error: 'Network error' }
  }
}

// Basic moderation (synchronous, for quick checks)
export function moderateContentBasic(text: string): ModerationResult {
  const lowerText = text.toLowerCase()
  const flaggedWords: string[] = []
  const suspiciousMatches: string[] = []
  
  // Check for profanity
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    if (regex.test(lowerText)) {
      flaggedWords.push(word)
    }
  }
  
  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      suspiciousMatches.push(...matches.slice(0, 3))
    }
  }
  
  const hasProfanity = flaggedWords.length > 0
  const hasSuspiciousContent = suspiciousMatches.length > 0
  const isClean = !hasProfanity && !hasSuspiciousContent
  
  let confidence = 1.0
  if (hasProfanity) confidence -= 0.5
  if (hasSuspiciousContent) confidence -= 0.2
  if (text.length < 10) confidence -= 0.1
  if (text.length > 2000) confidence -= 0.1
  
  const shouldAutoApprove = isClean && text.length >= 10 && text.length <= 1000
  
  return {
    isClean,
    hasProfanity,
    hasSuspiciousContent,
    flaggedWords,
    suspiciousMatches,
    shouldAutoApprove,
    confidence: Math.max(0, Math.min(1, confidence))
  }
}

// Full moderation with OpenAI (async)
export async function moderateContent(text: string): Promise<ModerationResult> {
  // First do basic check
  const basicResult = moderateContentBasic(text)
  
  // If basic check already flags it, no need for OpenAI
  if (basicResult.hasProfanity) {
    return basicResult
  }
  
  // Call OpenAI for deeper analysis
  const openAIResult = await moderateWithOpenAI(text)
  
  // Combine results
  const openAIFlagged = openAIResult.flagged || false
  const openAICategories = openAIResult.flaggedCategories || []
  
  // Update result based on OpenAI
  const isClean = basicResult.isClean && !openAIFlagged
  let confidence = basicResult.confidence
  
  if (openAIFlagged) {
    confidence -= 0.4
  }
  
  // Auto-approve only if both checks pass
  const shouldAutoApprove = isClean && 
    !openAIFlagged && 
    text.length >= 10 && 
    text.length <= 1000 &&
    !openAIResult.usingFallback // Only auto-approve if we actually checked with OpenAI
  
  return {
    ...basicResult,
    isClean,
    shouldAutoApprove,
    confidence: Math.max(0, Math.min(1, confidence)),
    openAIFlagged,
    openAICategories
  }
}

// Check if a comment should be auto-approved based on time
export function shouldAutoApproveByTime(createdAt: string, hoursThreshold: number = 24): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const hoursPassed = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  return hoursPassed >= hoursThreshold
}

// Sanitize content for display (remove potential XSS)
export function sanitizeContent(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
