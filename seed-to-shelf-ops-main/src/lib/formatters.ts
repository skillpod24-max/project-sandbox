// Indian number formatting utility (1,23,45,678)
export const formatIndianNumber = (num: number): string => {
  if (num === 0) return "0";
  if (!num || isNaN(num)) return "0";
  
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const numStr = Math.round(absNum).toString();
  
  if (numStr.length <= 3) {
    return (isNegative ? "-" : "") + numStr;
  }
  
  // Last 3 digits
  const lastThree = numStr.slice(-3);
  // Remaining digits
  const remaining = numStr.slice(0, -3);
  
  // Add commas every 2 digits for remaining
  const formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  
  return (isNegative ? "-" : "") + formatted + "," + lastThree;
};

export const formatCurrency = (num: number): string => {
  return "₹" + formatIndianNumber(num);
};

// Calculate profit = (SP - CP) - Discount
// Profit is the difference between selling price and cost price, minus any discount given
export const calculateProfit = (
  sellingPrice: number, 
  purchasePrice: number, 
  discount: number = 0
): number => {
  // Profit = (Selling Price - Purchase Price) - Discount
  // Discount reduces the profit, not the selling price itself for profit calculation
  return (sellingPrice - purchasePrice) - discount;
};
