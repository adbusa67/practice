-- SQ2: Add categories and event_categories tables for many-to-many relationship
-- This allows events to have multiple categories and categories to be used by multiple events

-- Create categories table
CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    color text, -- Optional: for UI theming
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Create event_categories junction table for many-to-many relationship
CREATE TABLE event_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT now(),
    -- Ensure no duplicate event-category pairs
    UNIQUE(event_id, category_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_event_categories_event_id ON event_categories(event_id);
CREATE INDEX idx_event_categories_category_id ON event_categories(category_id);

-- Add some sample categories
INSERT INTO categories (name, description, color) VALUES
    ('Technology', 'Tech talks, coding workshops, and software development events', '#3B82F6'),
    ('Networking', 'Professional networking and business events', '#10B981'),
    ('Education', 'Learning workshops, seminars, and training sessions', '#F59E0B'),
    ('Social', 'Community gatherings, parties, and social events', '#EF4444'),
    ('Health & Wellness', 'Fitness, mental health, and wellness events', '#8B5CF6'),
    ('Arts & Culture', 'Art exhibitions, cultural events, and performances', '#EC4899'),
    ('Sports', 'Athletic events, tournaments, and sports activities', '#06B6D4'),
    ('Food & Drink', 'Culinary events, tastings, and food-related gatherings', '#84CC16');
