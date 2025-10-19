-- Add tsvector column for full-text search with weights on events

ALTER TABLE events ADD COLUMN search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_events_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  venue_name_text TEXT;
BEGIN
  -- Note: Since venue is now a foreign key, we need to handle it differently
  IF NEW.venue_id IS NOT NULL THEN
    SELECT name INTO venue_name_text FROM venues WHERE id = NEW.venue_id;
  ELSE
    venue_name_text := '';
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(venue_name_text, '')), 'C');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain search vector
CREATE TRIGGER update_events_search_vector_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_search_vector();

-- Also update search vector when venue name changes
CREATE OR REPLACE FUNCTION update_events_search_vector_on_venue_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all events that use this venue
  UPDATE events
  SET updated_at = NOW()  -- This will trigger the search vector update
  WHERE venue_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_search_vector_trigger
  AFTER UPDATE OF name ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_events_search_vector_on_venue_change();

-- Backfill search_vector for existing records
UPDATE events e
SET search_vector =
  setweight(to_tsvector('english', COALESCE(e.name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(e.description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(e.location, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(v.name, '')), 'C')
FROM venues v
WHERE e.venue_id = v.id;

-- Handle events without venues
UPDATE events
SET search_vector =
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'C')
WHERE venue_id IS NULL AND search_vector IS NULL;

-- Create GIN index for fast full-text search
CREATE INDEX idx_events_search_vector ON events USING GIN (search_vector);
