// NBFC / EMI accounting constants

/** 
 * Rounding tolerance for EMI-based loans.
 * ₹1–₹10 differences can occur due to EMI rounding.
 * These must NOT block loan closure or appear as dues.
 */
export const ROUNDING_TOLERANCE = 10;

/**
 * Returns effective pending balance after rounding protection.
 * Anything <= ROUNDING_TOLERANCE is treated as zero.
 */
export const getEffectiveBalance = (balance: number): number => {
  return balance > ROUNDING_TOLERANCE ? balance : 0;
};

/**
 * Checks if a loan is effectively settled.
 */
export const isEffectivelySettled = (balance: number): boolean => {
  return balance <= ROUNDING_TOLERANCE;
};
