// NBFC / EMI accounting constants and utilities

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
 * Treats small remaining amounts (<=₹10) as settled.
 */
export const isEffectivelySettled = (balance: number): boolean => {
  return balance <= ROUNDING_TOLERANCE;
};

/**
 * Calculate realized profit based on principal collected.
 * Profit unlocks proportionally as customer pays principal.
 * 
 * @param principalCollected - Total principal amount collected from customer
 * @param sellingPrice - Total selling price of the vehicle
 * @param purchasePrice - Purchase price of the vehicle
 * @returns The realized profit amount
 */
export const calculateRealisedProfit = (
  principalCollected: number,
  sellingPrice: number,
  purchasePrice: number
): number => {
  const totalProfit = sellingPrice - purchasePrice;
  
  // If no profit or negative margin, return 0
  if (totalProfit <= 0) return 0;
  
  // Profit ratio = profit / selling price
  const profitRatio = sellingPrice > 0 ? totalProfit / sellingPrice : 0;
  
  // Realised profit = principal collected * profit ratio
  // Capped at total profit to avoid over-counting
  const rawRealisedProfit = principalCollected * profitRatio;
  
  return Math.min(rawRealisedProfit, totalProfit);
};

/**
 * Calculate pending profit that hasn't been realized yet.
 * Uses rounding tolerance to avoid showing small amounts as pending.
 * 
 * @param totalProfit - Total expected profit from the sale
 * @param realisedProfit - Already realized profit
 * @returns Pending profit after rounding tolerance
 */
export const calculatePendingProfit = (
  totalProfit: number,
  realisedProfit: number
): number => {
  const rawPending = totalProfit - realisedProfit;
  return getEffectiveBalance(rawPending);
};

/**
 * Determines the profit status for UI display.
 * 
 * @param pendingProfit - Amount of profit still pending
 * @param totalProfit - Total expected profit
 * @returns Status string: 'realized', 'partial', or 'pending'
 */
export const getProfitStatus = (
  pendingProfit: number,
  totalProfit: number
): 'realized' | 'partial' | 'pending' => {
  if (pendingProfit <= 0 || isEffectivelySettled(pendingProfit)) {
    return 'realized';
  }
  
  const realisedPercent = totalProfit > 0 
    ? ((totalProfit - pendingProfit) / totalProfit) * 100 
    : 0;
  
  if (realisedPercent > 0) {
    return 'partial';
  }
  
  return 'pending';
};

/**
 * Format profit status for display with color class.
 */
export const getProfitStatusDisplay = (status: 'realized' | 'partial' | 'pending'): {
  label: string;
  colorClass: string;
} => {
  switch (status) {
    case 'realized':
      return { label: 'Realized', colorClass: 'text-emerald-600 bg-emerald-50' };
    case 'partial':
      return { label: 'Partial', colorClass: 'text-amber-600 bg-amber-50' };
    case 'pending':
      return { label: 'Pending', colorClass: 'text-slate-600 bg-slate-100' };
  }
};
