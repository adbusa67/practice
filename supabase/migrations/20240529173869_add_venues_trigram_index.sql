-- Add trigram index on venues.name for efficient ILIKE searches
-- This ensures the ILIKE fallback strategy can efficiently search venue names

CREATE INDEX idx_venues_name_trgm ON venues USING GIN (name gin_trgm_ops);

-- Also drop the unused venue trigram index from the old events.venue column
-- This was left behind when the venue column was replaced with venue_id
DROP INDEX IF EXISTS idx_events_venue_trgm;
