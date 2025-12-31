/**
 * API Quota Service
 * Tracks remaining tokens/credits from OpenAI and Google APIs
 */

export interface QuotaInfo {
  provider: 'OpenAI' | 'Google';
  totalTokens: number;
  usedTokens: number;
  remainingTokens: number;
  resetDate?: Date;
  isCustomKey: boolean;
}

export class ApiQuotaService {
  /**
   * Check OpenAI API quota
   * Note: OpenAI doesn't provide a direct API for checking remaining credits
   * You need to check your usage dashboard at: https://platform.openai.com/usage
   */
  static async getOpenAIQuota(apiKey: string): Promise<QuotaInfo | null> {
    try {
      // OpenAI doesn't have a public API endpoint for quota checking
      // You'll need to manually set your purchased amount in settings
      // For now, return null - we'll track usage instead
      return null;
    } catch (error) {
      console.error('Error fetching OpenAI quota:', error);
      return null;
    }
  }

  /**
   * Check Google Gemini API quota
   * Google provides usage info through their API
   */
  static async getGoogleQuota(apiKey: string): Promise<QuotaInfo | null> {
    try {
      // Google Gemini has rate limits but not a direct quota API
      // You can check at: https://aistudio.google.com/app/apikey
      return null;
    } catch (error) {
      console.error('Error fetching Google quota:', error);
      return null;
    }
  }

  /**
   * Calculate remaining tokens based on manual quota and tracked usage
   */
  static async calculateRemainingTokens(
    provider: 'OpenAI' | 'Google',
    purchasedTokens: number,
    usedTokens: number
  ): Promise<QuotaInfo> {
    return {
      provider,
      totalTokens: purchasedTokens,
      usedTokens,
      remainingTokens: purchasedTokens - usedTokens,
      isCustomKey: false
    };
  }

  /**
   * Get usage percentage
   */
  static getUsagePercentage(quota: QuotaInfo): number {
    if (quota.totalTokens === 0) return 0;
    return Math.round((quota.usedTokens / quota.totalTokens) * 100);
  }

  /**
   * Check if quota is running low (< 20%)
   */
  static isQuotaLow(quota: QuotaInfo): boolean {
    return this.getUsagePercentage(quota) > 80;
  }
}
