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
  if (balance < 0) return 0;
  return balance > ROUNDING_TOLERANCE ? balance : 0;
};

/**
 * Checks if a loan is effectively settled.
 * Treats small remaining amounts (<=₹10) as settled.
 */
export const isEffectivelySettled = (balance: number): boolean => {
  return Math.abs(balance) <= ROUNDING_TOLERANCE;
};

/**
 * Calculate realized profit based on principal collected.
 * Profit unlocks proportionally as customer pays principal.
 * 
 * NBFC Grade Logic:
 * - Profit is only realized when principal is collected
 * - Interest income is separate from vehicle profit
 * - Profit ratio = (Selling Price - Purchase Price) / Selling Price
 * - Realized Profit = Principal Collected × Profit Ratio
 * - Capped at total expected profit to prevent over-counting
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
  // Validate inputs
  if (principalCollected < 0 || sellingPrice < 0 || purchasePrice < 0) return 0;
  
  const totalProfit = sellingPrice - purchasePrice;
  
  // If no profit or negative margin, return 0
  if (totalProfit <= 0) return 0;
  
  // If nothing collected, no profit realized
  if (principalCollected <= 0) return 0;
  
  // Profit ratio = profit / selling price
  const profitRatio = sellingPrice > 0 ? totalProfit / sellingPrice : 0;
  
  // Realised profit = principal collected * profit ratio
  // Capped at total profit to avoid over-counting
  const rawRealisedProfit = principalCollected * profitRatio;
  
  return Math.min(Math.round(rawRealisedProfit * 100) / 100, totalProfit);
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
 * Calculate interest earned from EMI payments.
 * Interest = Total EMI Payments - Principal Component
 * 
 * @param totalEmiAmount - Sum of all EMI amounts
 * @param principalComponent - Principal portion of EMIs
 * @returns Interest amount collected
 */
export const calculateInterestIncome = (
  totalEmiAmount: number,
  principalComponent: number
): number => {
  const interest = totalEmiAmount - principalComponent;
  return Math.max(interest, 0);
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
  // If total profit is zero or negative, mark as realized
  if (totalProfit <= 0) return 'realized';
  
  // If pending is effectively zero, fully realized
  if (pendingProfit <= 0 || isEffectivelySettled(pendingProfit)) {
    return 'realized';
  }
  
  const realisedPercent = ((totalProfit - pendingProfit) / totalProfit) * 100;
  
  // If any profit has been realized, mark as partial
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
  bgClass: string;
} => {
  switch (status) {
    case 'realized':
      return { label: 'Realized', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50' };
    case 'partial':
      return { label: 'Partial', colorClass: 'text-amber-600', bgClass: 'bg-amber-50' };
    case 'pending':
      return { label: 'Pending', colorClass: 'text-slate-600', bgClass: 'bg-slate-100' };
  }
};

/**
 * Calculate loan health score for NBFC reporting.
 * Score from 0-100 based on payment regularity.
 * 
 * @param onTimePayments - Number of on-time payments
 * @param totalPayments - Total payments made
 * @param overduePayments - Number of overdue payments
 * @returns Health score 0-100
 */
export const calculateLoanHealthScore = (
  onTimePayments: number,
  totalPayments: number,
  overduePayments: number
): number => {
  if (totalPayments === 0) return 100;
  
  const onTimeRatio = onTimePayments / totalPayments;
  const overdueRatio = overduePayments / totalPayments;
  
  // Score: 100 if all on-time, reduced by overdue ratio
  const baseScore = onTimeRatio * 100;
  const penalty = overdueRatio * 30; // 30% penalty for overdue
  
  return Math.max(0, Math.min(100, Math.round(baseScore - penalty)));
};

/**
 * Get loan health grade based on score.
 */
export const getLoanHealthGrade = (score: number): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  label: string;
  colorClass: string;
} => {
  if (score >= 90) return { grade: 'A', label: 'Excellent', colorClass: 'text-emerald-600 bg-emerald-50' };
  if (score >= 75) return { grade: 'B', label: 'Good', colorClass: 'text-blue-600 bg-blue-50' };
  if (score >= 60) return { grade: 'C', label: 'Average', colorClass: 'text-amber-600 bg-amber-50' };
  if (score >= 40) return { grade: 'D', label: 'Poor', colorClass: 'text-orange-600 bg-orange-50' };
  return { grade: 'F', label: 'Critical', colorClass: 'text-red-600 bg-red-50' };
};
