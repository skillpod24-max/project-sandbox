

## Issues Identified

### 1. Excessive DB calls on every page visit
**Root cause**: `refetchOnMount: "always"` in the global QueryClient config (line 73 of `App.tsx`). This forces every query to re-fetch on mount regardless of `staleTime`, defeating the 5-minute cache. Every time a user navigates to Dashboard, Vehicles, Customers, etc., all queries fire again.

**Fix**: Change `refetchOnMount: "always"` to `refetchOnMount: true` (default). With `staleTime: 5 * 60 * 1000` already set, queries will only refetch if data is older than 5 minutes.

### 2. Marketplace "No vehicles found" for public/anonymous users
**Root cause**: The `AllVehicles.tsx` query fetches vehicles with `.in("user_id", dealerIds)` but does NOT filter by `is_public = true`. The RLS policy on `vehicles` only allows anonymous users to see rows where `is_public = true`. Since the query doesn't include this filter, Supabase returns empty results for unauthenticated users.

Similarly, the `vehicle_images` query needs vehicles with `is_public = true` to be visible (RLS checks the parent vehicle's `is_public` flag).

**Fix**: Add `.eq("is_public", true)` to the vehicles query in `AllVehicles.tsx` (and similar marketplace pages like `Marketplace.tsx`, `MarketplaceDealer.tsx`).

### 3. Reports.tsx still uses setState pattern with side-effects inside useQuery
The `fetchReportData()` function sets 15+ state variables via `useState` and is wrapped in `useQuery` only as a trigger. This means React Query caches `null` while the actual data lives in component state -- losing cache benefits on re-mount.

**Fix (lightweight)**: Keep the current pattern but ensure the global `refetchOnMount` fix prevents unnecessary re-fetches. The `staleTime: 2min` on Reports queries will now actually work.

### 4. Dashboard fetches ALL payments, leads, events without limits
`fetchDashboardDetails` fetches all payments and all events for the user with no date filter or limit. For dealers with 1000+ records, this is wasteful.

**Fix**: Add date filters (last 6 months for payments/events since that's what the cash flow chart shows) and `.limit()` where appropriate.

## Implementation Plan

### Step 1: Fix global QueryClient config
- File: `src/App.tsx`
- Change `refetchOnMount: "always"` to `refetchOnMount: true`
- This single change eliminates redundant DB calls across ALL pages

### Step 2: Fix marketplace vehicle visibility for public users
- File: `src/pages/marketplace/AllVehicles.tsx`
- Add `.eq("is_public", true)` to the vehicles query
- This aligns with the RLS policy that only exposes public vehicles to anonymous users

### Step 3: Optimize Dashboard detail queries
- File: `src/services/api/dashboard.ts`
- Add 6-month date filter to payments and events queries
- Add `.limit(200)` to events query as a safety cap
- Reduces payload for dealers with large datasets

### Step 4: Add staleTime to service hooks missing it
- Files: `src/services/api/customers.ts`, `src/services/api/expenses.ts`, `src/services/api/vehicles.ts`
- These hooks have no `staleTime` set (they inherit the 5min global default, which is fine, but were being defeated by `refetchOnMount: "always"`)
- After the Step 1 fix, these will automatically benefit

### Technical Details
- The `refetchOnMount: "always"` setting was the primary architectural flaw, causing O(n) DB calls per navigation where n = number of queries on the page
- The marketplace RLS issue is a data isolation problem: vehicles table requires `is_public = true` for anonymous SELECT, but the frontend query didn't include this filter
- No migration needed; all fixes are frontend-only

