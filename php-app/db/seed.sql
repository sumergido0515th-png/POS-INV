-- JP Laagan MotoPOS — demo seed data (PHP/MySQL edition)
-- Import AFTER schema.sql, once. Re-running will fail on duplicate
-- unique keys (username, sku, etc.) rather than silently duplicating rows.

SET NAMES utf8mb4;

INSERT INTO users (name, username, email, password_hash, role) VALUES
  ('Juan Paulo Laagan', 'admin', 'admin@jplaagan.local', '$2y$12$UDyKqv1xuoUJprk2XKE00Oe2bqyoWjxE9bwMaYkJoBCdlBkqq0WYe', 'ADMIN'),
  ('Maria Santos', 'cashier', 'cashier@jplaagan.local', '$2y$12$FXfthP8...199qcnsf4NFO.WmQili6MYp3FHuaUG95PTE.yxdutGe', 'CASHIER');

INSERT INTO settings (business_name, address, phone, email, tax_rate, currency, receipt_footer, low_stock_threshold) VALUES
  ('JP Laagan MotoPOS', 'Poblacion, Laguna, Philippines', '0917-000-0000', 'contact@jplaagan.local', 12.00, 'PHP', 'Thank you for riding with us! No return, no exchange without receipt.', 5);

INSERT INTO categories (name, description) VALUES
  ('Engine Parts', 'Pistons, gaskets, valves, engine internals'),
  ('Brake System', 'Brake pads, discs, calipers, brake fluid'),
  ('Electrical', 'Batteries, spark plugs, bulbs, wiring, CDI'),
  ('Tires & Wheels', 'Tires, tubes, rims, sprockets'),
  ('Body & Frame', 'Fairings, mirrors, seats, handlebars'),
  ('Oil & Fluids', 'Engine oil, coolant, chain lube'),
  ('Transmission', 'Chains, sprockets, clutch parts'),
  ('Suspension', 'Shock absorbers, forks, bushings'),
  ('Filters', 'Air filters, oil filters, fuel filters'),
  ('Accessories', 'Helmets, gloves, phone mounts, alarms');

INSERT INTO brands (name) VALUES
  ('Honda'),
  ('Yamaha'),
  ('Suzuki'),
  ('Kawasaki'),
  ('NGK'),
  ('Motul'),
  ('Yuasa'),
  ('Universal');

INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
  ('MotoParts Trading Corp.', 'Ramon Cruz', '0918-111-2222', 'sales@motopartstrading.ph', 'Cavite, Philippines'),
  ('Laguna Cycle Supply', 'Ellen Reyes', '0919-333-4444', 'orders@lagunacycle.ph', 'Sta. Rosa, Laguna');

-- Products reference category/brand/supplier by name lookup so row order
-- above doesn't need to match auto-increment IDs.
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ENG-PST-001', 'Piston Kit STD 125cc', 'set', 320, 480, 18, 5,
    (SELECT id FROM categories WHERE name = 'Engine Parts'),
    (SELECT id FROM brands WHERE name = 'Honda'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ENG-GSK-002', 'Cylinder Head Gasket Set', 'set', 85, 150, 25, 8,
    (SELECT id FROM categories WHERE name = 'Engine Parts'),
    (SELECT id FROM brands WHERE name = 'Honda'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ENG-VLV-003', 'Intake Valve Assembly', 'pc', 210, 350, 12, 4,
    (SELECT id FROM categories WHERE name = 'Engine Parts'),
    (SELECT id FROM brands WHERE name = 'Yamaha'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'BRK-PAD-004', 'Front Brake Pad Set', 'set', 95, 175, 40, 10,
    (SELECT id FROM categories WHERE name = 'Brake System'),
    (SELECT id FROM brands WHERE name = 'Yamaha'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'BRK-DSC-005', 'Brake Disc Rotor 220mm', 'pc', 380, 620, 10, 3,
    (SELECT id FROM categories WHERE name = 'Brake System'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'BRK-FLD-006', 'DOT 4 Brake Fluid 500ml', 'bottle', 120, 220, 30, 8,
    (SELECT id FROM categories WHERE name = 'Brake System'),
    (SELECT id FROM brands WHERE name = 'Motul'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'BRK-CLP-007', 'Rear Brake Caliper', 'pc', 650, 980, 6, 2,
    (SELECT id FROM categories WHERE name = 'Brake System'),
    (SELECT id FROM brands WHERE name = 'Suzuki'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ELE-BAT-008', 'YTZ7S Maintenance-Free Battery', 'pc', 1450, 2100, 14, 4,
    (SELECT id FROM categories WHERE name = 'Electrical'),
    (SELECT id FROM brands WHERE name = 'Yuasa'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ELE-SPK-009', 'NGK Spark Plug CPR8EA-9', 'pc', 90, 160, 60, 15,
    (SELECT id FROM categories WHERE name = 'Electrical'),
    (SELECT id FROM brands WHERE name = 'NGK'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ELE-CDI-010', 'CDI Unit Racing', 'pc', 480, 780, 9, 3,
    (SELECT id FROM categories WHERE name = 'Electrical'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ELE-BLB-011', 'LED Headlight Bulb H4', 'pc', 150, 280, 35, 10,
    (SELECT id FROM categories WHERE name = 'Electrical'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'TIR-TIR-012', 'Tubeless Tire 80/90-17', 'pc', 950, 1450, 20, 6,
    (SELECT id FROM categories WHERE name = 'Tires & Wheels'),
    (SELECT id FROM brands WHERE name = 'Honda'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'TIR-TIR-013', 'Tubeless Tire 100/90-17', 'pc', 1050, 1600, 16, 6,
    (SELECT id FROM categories WHERE name = 'Tires & Wheels'),
    (SELECT id FROM brands WHERE name = 'Yamaha'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'TIR-TUB-014', 'Inner Tube 17-inch', 'pc', 65, 130, 45, 12,
    (SELECT id FROM categories WHERE name = 'Tires & Wheels'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'TIR-SPR-015', 'Rear Sprocket 428-42T', 'pc', 280, 450, 22, 6,
    (SELECT id FROM categories WHERE name = 'Tires & Wheels'),
    (SELECT id FROM brands WHERE name = 'Suzuki'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'BDY-MIR-016', 'Side Mirror Set (L/R)', 'set', 140, 260, 28, 8,
    (SELECT id FROM categories WHERE name = 'Body & Frame'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'BDY-SET-017', 'Motorcycle Seat Cover', 'pc', 220, 380, 15, 5,
    (SELECT id FROM categories WHERE name = 'Body & Frame'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'BDY-HDL-018', 'Handlebar Grip Set', 'set', 75, 140, 33, 10,
    (SELECT id FROM categories WHERE name = 'Body & Frame'),
    (SELECT id FROM brands WHERE name = 'Kawasaki'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'OIL-ENG-019', 'Motul 3000 4T 20W-50 1L', 'bottle', 210, 340, 55, 15,
    (SELECT id FROM categories WHERE name = 'Oil & Fluids'),
    (SELECT id FROM brands WHERE name = 'Motul'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'OIL-CHN-020', 'Chain Lube Spray 400ml', 'can', 180, 300, 26, 8,
    (SELECT id FROM categories WHERE name = 'Oil & Fluids'),
    (SELECT id FROM brands WHERE name = 'Motul'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'OIL-CLT-021', 'Radiator Coolant 1L', 'bottle', 110, 190, 20, 6,
    (SELECT id FROM categories WHERE name = 'Oil & Fluids'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'TRN-CHN-022', 'Drive Chain 428H-124L', 'pc', 480, 750, 17, 5,
    (SELECT id FROM categories WHERE name = 'Transmission'),
    (SELECT id FROM brands WHERE name = 'Honda'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'TRN-CLT-023', 'Clutch Plate Set', 'set', 320, 520, 13, 4,
    (SELECT id FROM categories WHERE name = 'Transmission'),
    (SELECT id FROM brands WHERE name = 'Yamaha'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'TRN-CBL-024', 'Clutch Cable', 'pc', 65, 120, 38, 10,
    (SELECT id FROM categories WHERE name = 'Transmission'),
    (SELECT id FROM brands WHERE name = 'Suzuki'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'SUS-SHK-025', 'Rear Shock Absorber (Pair)', 'pair', 890, 1350, 8, 3,
    (SELECT id FROM categories WHERE name = 'Suspension'),
    (SELECT id FROM brands WHERE name = 'Kawasaki'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'SUS-FRK-026', 'Front Fork Oil Seal Set', 'set', 95, 175, 24, 8,
    (SELECT id FROM categories WHERE name = 'Suspension'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'FIL-AIR-027', 'Air Filter Element', 'pc', 85, 150, 42, 12,
    (SELECT id FROM categories WHERE name = 'Filters'),
    (SELECT id FROM brands WHERE name = 'Honda'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'FIL-OIL-028', 'Oil Filter Cartridge', 'pc', 70, 130, 3, 12,
    (SELECT id FROM categories WHERE name = 'Filters'),
    (SELECT id FROM brands WHERE name = 'Yamaha'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'FIL-FUL-029', 'Fuel Filter Inline', 'pc', 45, 90, 2, 10,
    (SELECT id FROM categories WHERE name = 'Filters'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ACC-HLM-030', 'Full-Face Helmet (ICC Approved)', 'pc', 950, 1650, 12, 4,
    (SELECT id FROM categories WHERE name = 'Accessories'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ACC-GLV-031', 'Riding Gloves', 'pair', 180, 320, 4, 8,
    (SELECT id FROM categories WHERE name = 'Accessories'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');
INSERT INTO products (sku, name, unit, cost_price, selling_price, quantity, reorder_level, category_id, brand_id, supplier_id)
  SELECT 'ACC-ALM-032', 'Motorcycle Disc Alarm Lock', 'pc', 260, 450, 19, 6,
    (SELECT id FROM categories WHERE name = 'Accessories'),
    (SELECT id FROM brands WHERE name = 'Universal'),
    (SELECT id FROM suppliers WHERE name = 'MotoParts Trading Corp.');

-- Initial RECEIVE stock movement for every seeded product, attributed to admin.
INSERT INTO stock_movements (product_id, type, quantity, reason, user_id)
  SELECT p.id, 'RECEIVE', p.quantity, 'Initial stock (seed)', (SELECT id FROM users WHERE username = 'admin')
  FROM products p;

