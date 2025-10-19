-- SQ2: Add venues table with realistic constraints
-- Allows multiple venues with same name in different locations

CREATE TABLE venues (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    address text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    UNIQUE(name, address) -- Prevents duplicate venues at same location
);

-- Update events table to reference venues
ALTER TABLE events DROP COLUMN venue;
ALTER TABLE events ADD COLUMN venue_id uuid REFERENCES venues(id);

-- Update search vector to include venue names from joined table
-- Note: We'll need to update the trigger to handle this in the application layer
-- for now since the tsvector can't directly reference joined tables