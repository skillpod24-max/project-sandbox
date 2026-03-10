
CREATE OR REPLACE FUNCTION public.dashboard_summary(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_vehicles', (SELECT count(*) FROM vehicles WHERE user_id = p_user_id),
    'vehicles_in_stock', (SELECT count(*) FROM vehicles WHERE user_id = p_user_id AND status = 'in_stock'),
    'vehicles_sold', (SELECT count(*) FROM vehicles WHERE user_id = p_user_id AND status = 'sold'),
    'vehicles_reserved', (SELECT count(*) FROM vehicles WHERE user_id = p_user_id AND status = 'reserved'),
    'total_customers', (SELECT count(*) FROM customers WHERE user_id = p_user_id),
    'total_vendors', (SELECT count(*) FROM vendors WHERE user_id = p_user_id),
    'total_sales_count', (SELECT count(*) FROM sales WHERE user_id = p_user_id AND status = 'completed'),
    'total_sales_value', (SELECT coalesce(sum(total_amount), 0) FROM sales WHERE user_id = p_user_id AND status = 'completed'),
    'total_revenue', (SELECT coalesce(sum(amount), 0) FROM payments WHERE user_id = p_user_id AND payment_type = 'customer_payment'),
    'total_cost', (SELECT coalesce(sum(amount), 0) FROM payments WHERE user_id = p_user_id AND payment_type = 'vendor_payment'),
    'total_expenses', (SELECT coalesce(sum(amount), 0) FROM expenses WHERE user_id = p_user_id),
    'pending_emis', (SELECT count(*) FROM emi_schedules WHERE user_id = p_user_id AND status = 'pending'),
    'monthly_collections', (
      SELECT coalesce(sum(amount), 0) FROM payments 
      WHERE user_id = p_user_id 
        AND payment_type = 'customer_payment'
        AND extract(month FROM created_at) = extract(month FROM now())
        AND extract(year FROM created_at) = extract(year FROM now())
    ),
    'inventory_value', json_build_object(
      'in_stock', (SELECT coalesce(sum(purchase_price), 0) FROM vehicles WHERE user_id = p_user_id AND status = 'in_stock'),
      'sold', (SELECT coalesce(sum(purchase_price), 0) FROM vehicles WHERE user_id = p_user_id AND status = 'sold'),
      'reserved', (SELECT coalesce(sum(purchase_price), 0) FROM vehicles WHERE user_id = p_user_id AND status = 'reserved')
    ),
    'lead_counts', json_build_object(
      'total', (SELECT count(*) FROM leads WHERE user_id = p_user_id),
      'qualified', (SELECT count(*) FROM leads WHERE user_id = p_user_id AND status = 'qualified'),
      'won', (SELECT count(*) FROM leads WHERE user_id = p_user_id AND status = 'won'),
      'lost', (SELECT count(*) FROM leads WHERE user_id = p_user_id AND status = 'lost')
    ),
    'outstanding_balance', (
      SELECT coalesce(sum(balance_amount), 0) FROM sales 
      WHERE user_id = p_user_id AND status = 'completed' AND balance_amount > 0
    )
  ) INTO result;
  
  RETURN result;
END;
$$;
