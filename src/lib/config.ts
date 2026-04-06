// App-wide configuration
export const APP_CONFIG = {
  // When true, all chambers are unlocked regardless of subscription
  // Flip to false when ready to monetize
  BETA_MODE: true,

  // Free tier limits
  FREE_LIMITS: {
    oracleQuestionsPerDay: 1,
    frequencyScannerFullReading: false,
    freeTones: 1,
  },
} as const;
