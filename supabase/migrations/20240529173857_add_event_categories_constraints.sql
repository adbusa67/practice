-- SQ2: Add additional constraints to event_categories join table
-- This ensures data integrity and prevents invalid relationships

-- Add check constraint to prevent self-referencing or invalid relationships
-- (Though this is less likely with UUIDs, it's good practice)
ALTER TABLE event_categories ADD CONSTRAINT event_categories_no_self_reference 
  CHECK (event_id != category_id);

-- Add check constraint to ensure created_at is not in the future
ALTER TABLE event_categories ADD CONSTRAINT event_categories_created_at_not_future 
  CHECK (created_at <= CURRENT_TIMESTAMP);

-- Add check constraint to ensure created_at is not too far in the past (e.g., before 2020)
-- This prevents accidentally inserting old data
ALTER TABLE event_categories ADD CONSTRAINT event_categories_created_at_reasonable 
  CHECK (created_at >= '2020-01-01'::timestamp);

-- Add a comment to document the table's purpose and constraints
COMMENT ON TABLE event_categories IS 'Junction table for many-to-many relationship between events and categories. Each row represents one event being associated with one category.';
COMMENT ON COLUMN event_categories.event_id IS 'Foreign key to events table. CASCADE delete when event is deleted.';
COMMENT ON COLUMN event_categories.category_id IS 'Foreign key to categories table. CASCADE delete when category is deleted.';
COMMENT ON CONSTRAINT event_categories_event_id_category_id_key ON event_categories IS 'Prevents duplicate event-category pairs. Each event can only be associated with each category once.';

-- Add a partial index for better performance on common queries
-- This index helps with queries like "find all events in a specific category"
-- Using a fixed date instead of CURRENT_DATE to avoid immutability issues
CREATE INDEX idx_event_categories_category_id_created 
  ON event_categories(category_id, created_at) 
  WHERE created_at >= '2024-01-01'::timestamp;

-- Add a partial index for recent event-category relationships
-- This helps with queries for recent events
CREATE INDEX idx_event_categories_recent_events 
  ON event_categories(event_id, created_at) 
  WHERE created_at >= '2024-07-01'::timestamp;
