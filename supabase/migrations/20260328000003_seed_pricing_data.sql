-- Seed pricing_config with current hardcoded values
-- Mail piece printing costs (unit_amount in raw units, 1 unit = $0.001)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, unit_amount, unit_label, sort_order) VALUES
  ('mail_piece', 'postcard_4x6', '4x6 Postcard', 'Standard 4x6 postcard printing', 'per_unit', 45, 'per piece', 1),
  ('mail_piece', 'postcard_5x7', '5x7 Postcard', 'Standard 5x7 postcard printing', 'per_unit', 65, 'per piece', 2),
  ('mail_piece', 'letter_8_5x11', '8.5x11 Letter', 'Full-size letter printing', 'per_unit', 75, 'per piece', 3),
  ('mail_piece', 'letter_folded', 'Folded Letter', 'Tri-fold letter printing', 'per_unit', 95, 'per piece', 4)
ON CONFLICT (category, key) DO NOTHING;

-- Paper stock upcharges (raw units)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, unit_amount, unit_label, sort_order) VALUES
  ('paper_stock', 'standard_14pt', 'Standard 14pt', 'Standard cardstock', 'per_unit', 0, 'per piece', 1),
  ('paper_stock', 'premium_16pt', 'Premium 16pt', 'Premium heavyweight cardstock', 'per_unit', 5, 'per piece', 2),
  ('paper_stock', 'luxury_18pt', 'Luxury 18pt', 'Luxury ultra-thick cardstock', 'per_unit', 10, 'per piece', 3)
ON CONFLICT (category, key) DO NOTHING;

-- Finish upcharges (raw units)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, unit_amount, unit_label, sort_order) VALUES
  ('finish', 'matte', 'Matte', 'Standard matte finish', 'per_unit', 0, 'per piece', 1),
  ('finish', 'gloss', 'Gloss', 'High-gloss UV finish', 'per_unit', 2, 'per piece', 2),
  ('finish', 'uv_coating', 'UV Coating', 'Full UV protective coating', 'per_unit', 5, 'per piece', 3)
ON CONFLICT (category, key) DO NOTHING;

-- Postage costs (raw units)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, unit_amount, unit_label, sort_order) VALUES
  ('postage', 'first_class_forever', 'First Class Forever', 'USPS First Class Forever stamp', 'per_unit', 73, 'per piece', 1),
  ('postage', 'first_class_discounted', 'First Class Discounted', 'Discounted rate (200+ pieces)', 'per_unit', 60, 'per piece', 2),
  ('postage', 'standard', 'Standard Class', 'USPS Standard/Marketing Mail (200+ pieces)', 'per_unit', 25, 'per piece', 3)
ON CONFLICT (category, key) DO NOTHING;

-- Shipping config (stored as JSON metadata since it has base + per-piece)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, unit_amount, unit_label, sort_order, metadata) VALUES
  ('shipping', 'ship_processed', 'Ship Processed', 'Printed and shipped to customer', 'flat', 1500, 'base fee', 1, '{"perPiece": 2}'),
  ('shipping', 'full_service', 'Full Service', 'Full mailing service (no separate shipping)', 'flat', 0, 'included', 2, '{"perPiece": 0}')
ON CONFLICT (category, key) DO NOTHING;

-- Volume discounts (stored as tiered config)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, tier_config, unit_label, sort_order) VALUES
  ('volume_discount', 'printing_discount', 'Volume Discount', 'Discount on printing costs by quantity', 'volume_discount',
   '[{"min": 500, "max": 999, "price": 3}, {"min": 1000, "max": 2499, "price": 5}, {"min": 2500, "max": 4999, "price": 7}, {"min": 5000, "max": null, "price": 10}]'::jsonb,
   'percent off', 1)
ON CONFLICT (category, key) DO NOTHING;

-- Address validation tiers (standalone purchases only)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, tier_config, unit_label, sort_order) VALUES
  ('address_validation', 'validation_tiers', 'Address Validation', 'CASS-certified validation (standalone purchase only, included free with mail orders)', 'tiered',
   '[{"min": 1, "max": 200, "price": 800}, {"min": 201, "max": 1000, "price": 2000}, {"min": 1001, "max": 2000, "price": 3500}, {"min": 2001, "max": 5000, "price": 5000}, {"min": 5001, "max": 10000, "price": 7500}, {"min": 10001, "max": 20000, "price": 10000}, {"min": 20001, "max": 50000, "price": 15000}, {"min": 50001, "max": 100000, "price": 25000}, {"min": 100001, "max": 1000000, "price": 40000}]'::jsonb,
   'per job', 1)
ON CONFLICT (category, key) DO NOTHING;

-- Add-on services (unit_amount in cents)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, unit_amount, unit_label, sort_order) VALUES
  ('add_on_service', 'mailing_lists', 'Mailing Lists', 'Targeted mailing list records based on demographics', 'per_unit', 12, 'per record', 1),
  ('add_on_service', 'skip_tracing', 'Skip Tracing', 'Phone numbers and emails for prospects', 'per_unit', 10, 'per record', 2),
  ('add_on_service', 'mail_tracking', 'Mail Tracking', 'Per-mailing tracking with alerts and analytics', 'flat', 2500, 'per mailing', 3),
  ('add_on_service', 'list_formatting', 'List Formatting', 'Capitalization, column corrections, USPS validation', 'per_unit', 5, 'per record', 4),
  ('add_on_service', 'list_parsing', 'List Parsing', 'Address extraction and name separation', 'per_unit', 25, 'per record', 5)
ON CONFLICT (category, key) DO NOTHING;

-- Design services (unit_amount in cents, not public yet)
INSERT INTO pricing_config (category, key, display_name, description, pricing_model, unit_amount, unit_label, is_public, sort_order) VALUES
  ('design_service', 'basic_design', 'Basic Design', 'Professional template-based design', 'flat', 2500, 'per design', false, 1),
  ('design_service', 'custom_design', 'Custom Design', 'Custom design from scratch', 'flat', 9900, 'per design', false, 2),
  ('design_service', 'premium_design', 'Premium Design', 'Premium design with revisions and consultation', 'flat', 19900, 'per design', false, 3)
ON CONFLICT (category, key) DO NOTHING;
