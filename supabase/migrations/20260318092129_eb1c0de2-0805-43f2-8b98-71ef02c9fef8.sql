
-- Step 1: Insert 200 vendors
INSERT INTO vendors (code, name, phone, user_id, is_active)
SELECT 
  'VND' || lpad(i::text, 4, '0'),
  (ARRAY['Kumar Motors','Singh Auto','Sharma Cars','Patel Vehicles','Gupta Trading','Reddy Auto','Nair Motors','Das Vehicles','Joshi Cars','Mehta Auto'])[1 + (i % 10)],
  '98' || lpad((70000000 + i)::text, 8, '0'),
  'cc4bd47e-d436-47ab-94a3-819d9b6e52a8',
  true
FROM generate_series(1, 200) AS i;

-- Step 2: Insert 200 customers
INSERT INTO customers (code, full_name, phone, email, address, user_id, is_active)
SELECT 
  'CUS' || lpad(i::text, 4, '0'),
  (ARRAY['Rahul','Priya','Amit','Neha','Vikram','Ananya','Suresh','Divya','Rajesh','Meena'])[1 + (i % 10)] || ' ' || 
  (ARRAY['Sharma','Patel','Singh','Kumar','Gupta','Reddy','Nair','Das','Joshi','Mehta'])[1 + ((i/10) % 10)],
  '99' || lpad((80000000 + i)::text, 8, '0'),
  'customer' || i || '@test.com',
  (ARRAY['Chennai','Mumbai','Delhi','Bangalore','Hyderabad','Pune','Kolkata','Jaipur','Lucknow','Ahmedabad'])[1 + (i % 10)] || ', India',
  'cc4bd47e-d436-47ab-94a3-819d9b6e52a8',
  true
FROM generate_series(1, 200) AS i;

-- Step 3: Insert 300 vehicles with vendor_id from inserted vendors
INSERT INTO vehicles (code, brand, model, variant, color, vehicle_type, condition, fuel_type, transmission, status, purchase_price, selling_price, manufacturing_year, registration_number, odometer_reading, user_id, is_public, purchase_status, vendor_id)
SELECT 
  'VH' || lpad(i::text, 5, '0'),
  (ARRAY['Maruti Suzuki','Hyundai','Honda','Toyota','Tata','Mahindra','Kia','MG','Skoda','Volkswagen'])[1 + (i % 10)],
  (ARRAY['Swift','i20','City','Innova','Nexon','XUV700','Seltos','Hector','Slavia','Virtus'])[1 + (i % 10)],
  (ARRAY['LXi','VXi','ZXi','Sportz','V','Sigma','HTK Plus','Sharp','Active','Comfortline'])[1 + ((i/10) % 10)],
  (ARRAY['White','Silver','Black','Red','Blue','Grey','Brown','Green','Orange','Beige'])[1 + ((i/5) % 10)],
  'car',
  'used',
  (ARRAY['petrol','diesel','petrol','diesel','petrol','diesel','petrol','cng','electric','hybrid'])[1 + (i % 10)]::fuel_type,
  (CASE WHEN i % 3 = 0 THEN 'automatic' ELSE 'manual' END)::transmission_type,
  (CASE WHEN i % 5 = 0 THEN 'sold' WHEN i % 7 = 0 THEN 'reserved' ELSE 'in_stock' END)::vehicle_status,
  200000 + (i * 1500),
  300000 + (i * 2000),
  2018 + (i % 7),
  'TN' || lpad(((i % 99) + 1)::text, 2, '0') || ' ' || chr(65 + (i % 26)) || chr(65 + ((i+5) % 26)) || ' ' || lpad((1000 + i)::text, 4, '0'),
  5000 + (i * 100),
  'cc4bd47e-d436-47ab-94a3-819d9b6e52a8',
  false,
  'purchased',
  (SELECT id FROM vendors WHERE user_id = 'cc4bd47e-d436-47ab-94a3-819d9b6e52a8' AND code = 'VND' || lpad((1 + (i % 200))::text, 4, '0'))
FROM generate_series(1, 300) AS i;

-- Step 4: Insert 300 leads
INSERT INTO leads (lead_number, customer_name, phone, email, vehicle_interest, source, status, priority, user_id, follow_up_date, city, lead_type)
SELECT 
  'LD' || lpad(i::text, 5, '0'),
  (ARRAY['Arun','Lakshmi','Karthik','Deepa','Mohan','Saranya','Vijay','Pooja','Ganesh','Kavitha'])[1 + (i % 10)] || ' ' || 
  (ARRAY['R','S','K','M','P','V','N','D','J','L'])[1 + ((i/10) % 10)],
  '97' || lpad((60000000 + i)::text, 8, '0'),
  'lead' || i || '@test.com',
  (ARRAY['Swift','i20','City','Innova','Nexon','XUV700','Seltos','Hector','Slavia','Virtus'])[1 + (i % 10)],
  (ARRAY['walk_in','website','referral','marketplace','phone','social_media'])[1 + (i % 6)],
  (ARRAY['new','contacted','qualified','negotiation','won','lost'])[1 + (i % 6)],
  (ARRAY['high','medium','low'])[1 + (i % 3)],
  'cc4bd47e-d436-47ab-94a3-819d9b6e52a8',
  CURRENT_DATE + (i % 30),
  (ARRAY['Chennai','Mumbai','Delhi','Bangalore','Hyderabad','Pune','Kolkata','Jaipur'])[1 + (i % 8)],
  'buying'
FROM generate_series(1, 300) AS i;

-- Step 5: Insert 200 expenses
INSERT INTO expenses (expense_number, description, category, amount, expense_date, payment_mode, user_id)
SELECT 
  'EXP' || lpad(i::text, 5, '0'),
  (ARRAY['Office Rent','Electricity Bill','Staff Salary','Vehicle Washing','Advertising','Insurance Premium','Internet Bill','Maintenance','Fuel','Miscellaneous'])[1 + (i % 10)],
  (ARRAY['rent','utilities','salary','maintenance','marketing','insurance','utilities','maintenance','fuel','other'])[1 + (i % 10)],
  1000 + (i * 50),
  CURRENT_DATE - (i % 90),
  (ARRAY['cash','bank_transfer','upi','cheque','card'])[1 + (i % 5)]::payment_mode,
  'cc4bd47e-d436-47ab-94a3-819d9b6e52a8'
FROM generate_series(1, 200) AS i;

-- Step 6: Insert 200 payments
INSERT INTO payments (payment_number, amount, payment_type, payment_mode, payment_date, user_id, description)
SELECT 
  'PAY' || lpad(i::text, 5, '0'),
  5000 + (i * 200),
  (CASE WHEN i % 3 = 0 THEN 'vendor_payment' WHEN i % 3 = 1 THEN 'customer_payment' ELSE 'expense' END)::payment_type,
  (ARRAY['cash','bank_transfer','upi','cheque','card'])[1 + (i % 5)]::payment_mode,
  CURRENT_DATE - (i % 60),
  'cc4bd47e-d436-47ab-94a3-819d9b6e52a8',
  'Payment ' || i
FROM generate_series(1, 200) AS i;
