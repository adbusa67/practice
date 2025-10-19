-- SQ2: Add missing constraints for FK rules, check constraints, and capacity validation
-- This completes the relational modeling requirements

-- Add ON DELETE rules to existing foreign keys
ALTER TABLE events 
  DROP CONSTRAINT IF EXISTS events_organizer_id_fkey,
  ADD CONSTRAINT events_organizer_id_fkey 
    FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE SET NULL;

ALTER TABLE events 
  DROP CONSTRAINT IF EXISTS events_venue_id_fkey,
  ADD CONSTRAINT events_venue_id_fkey 
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE RESTRICT;

ALTER TABLE registrations 
  DROP CONSTRAINT IF EXISTS registrations_event_id_fkey,
  ADD CONSTRAINT registrations_event_id_fkey 
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE registrations 
  DROP CONSTRAINT IF EXISTS registrations_user_id_fkey,
  ADD CONSTRAINT registrations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add capacity field to events table
ALTER TABLE events ADD COLUMN capacity integer;

-- Add start_time and end_time fields to replace the single time field
ALTER TABLE events ADD COLUMN start_time timestamp;
ALTER TABLE events ADD COLUMN end_time timestamp;

-- Migrate existing time data to start_time (end_time will be calculated)
UPDATE events SET start_time = (date + time)::timestamp;

-- Make the old time field nullable since we're replacing it
ALTER TABLE events ALTER COLUMN time DROP NOT NULL;

-- Add check constraints for data validation
ALTER TABLE events ADD CONSTRAINT events_capacity_positive 
  CHECK (capacity IS NULL OR capacity > 0);

ALTER TABLE events ADD CONSTRAINT events_time_logic 
  CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time);

ALTER TABLE events ADD CONSTRAINT events_future_date 
  CHECK (date >= CURRENT_DATE - INTERVAL '3 months'); -- Allow events from 3 months ago for testing

-- Add check constraint for venue capacity (if we add capacity to venues)
ALTER TABLE venues ADD COLUMN capacity integer;
ALTER TABLE venues ADD CONSTRAINT venues_capacity_positive 
  CHECK (capacity IS NULL OR capacity > 0);

-- Add check constraint for venue name not empty
ALTER TABLE venues ADD CONSTRAINT venues_name_not_empty 
  CHECK (length(trim(name)) > 0);

-- Add check constraint for organizer name not empty
ALTER TABLE organizers ADD CONSTRAINT organizers_name_not_empty 
  CHECK (length(trim(name)) > 0);

-- Add check constraint for event name not empty
ALTER TABLE events ADD CONSTRAINT events_name_not_empty 
  CHECK (length(trim(name)) > 0);

-- Add check constraint for event description length (prevent extremely long descriptions)
ALTER TABLE events ADD CONSTRAINT events_description_length 
  CHECK (description IS NULL OR length(description) <= 5000);

-- Add check constraint for venue address format (basic validation)
ALTER TABLE venues ADD CONSTRAINT venues_address_format 
  CHECK (address IS NULL OR length(trim(address)) > 0);

-- Add check constraint for organizer contact info format
ALTER TABLE organizers ADD CONSTRAINT organizers_contact_format 
  CHECK (contact_info IS NULL OR length(trim(contact_info)) > 0);

-- Add unique constraint to prevent duplicate venue names at same address
-- (This already exists but let's make sure it's properly named)
ALTER TABLE venues DROP CONSTRAINT IF EXISTS venues_name_address_key;
ALTER TABLE venues ADD CONSTRAINT venues_name_address_unique 
  UNIQUE (name, address);

-- Add index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);

-- Add trigger to automatically set end_time if not provided (default to 2 hours after start)
CREATE OR REPLACE FUNCTION set_default_end_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NULL AND NEW.start_time IS NOT NULL THEN
    NEW.end_time := NEW.start_time + INTERVAL '2 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_default_end_time
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_default_end_time();
