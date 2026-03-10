// Centralized API service layer
// All Supabase fetches are defined here as reusable hooks
// Components should never fetch data directly — import from this layer

export { useDashboardData } from './dashboard';
export { useVehiclesPageData, useInvalidateVehicles } from './vehicles';
export { useLeadsData, useInvalidateLeads } from './leads';
export { usePaymentsData, useInvalidatePayments } from './payments';
export { useCustomersData, useInvalidateCustomers } from './customers';
export { useExpensesData, useInvalidateExpenses } from './expenses';
export type { Lead } from './leads';
export type { VehiclePageData } from './vehicles';
