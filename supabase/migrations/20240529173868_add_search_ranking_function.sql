-- SQ1: Create search_events_with_ranking function for FTS with time-based ranking
-- This function implements the search strategy described in SIDEQUESTS.md

CREATE OR REPLACE FUNCTION search_events_with_ranking(search_query text)
RETURNS TABLE (
  id uuid,
  name text,
  date timestamp,
  location text,
  description text,
  "time" time,
  venue_id uuid,
  organizer_id uuid,
  created_at timestamp,
  updated_at timestamp,
  capacity integer,
  start_time time,
  end_time time,
  rank real,
  score real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.date,
    e.location,
    e.description,
    e."time",
    e.venue_id,
    e.organizer_id,
    e.created_at,
    e.updated_at,
    e.capacity,
    e.start_time::time,
    e.end_time::time,
    ts_rank(e.search_vector, plainto_tsquery('english', search_query))::real as rank,
    -- Time-based scoring as described in SIDEQUESTS.md
    (ts_rank(e.search_vector, plainto_tsquery('english', search_query)) *
    CASE
      WHEN e.date > NOW() AND e.date <= NOW() + INTERVAL '7 days' THEN 1.5
      WHEN e.date > NOW() AND e.date <= NOW() + INTERVAL '30 days' THEN 1.2
      WHEN e.date > NOW() THEN 1.0
      ELSE 0.3
    END)::real as score
  FROM events e
  WHERE e.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY score DESC, rank DESC, e.date ASC;  -- Sort by score, then rank, then date
END;
$$ LANGUAGE plpgsql;
