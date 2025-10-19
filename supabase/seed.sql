-- Sample data insertion for users
INSERT INTO
    auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) (
        select
            '00000000-0000-0000-0000-000000000000',
            uuid_generate_v4 (),
            'authenticated',
            'authenticated',
            'user' || (ROW_NUMBER() OVER ()) || '@example.com',
            crypt ('testtest', gen_salt ('bf')),
            current_timestamp,
            current_timestamp,
            current_timestamp,
            '{"provider":"email","providers":["email"]}',
            '{}',
            current_timestamp,
            current_timestamp,
            '',
            '',
            '',
            ''
        FROM
            generate_series(1, 10)
    );

-- Sample data insertion for organizations
INSERT INTO organizations (id, name, type, contact_email) VALUES
(uuid_generate_v4(), 'City Recreation Department', 'government', 'recreation@city.gov'),
(uuid_generate_v4(), 'Cultural Arts Foundation', 'nonprofit', 'info@culturalarts.org'),
(uuid_generate_v4(), 'Community Sports League', 'community', 'league@communitysports.org'),
(uuid_generate_v4(), 'Downtown Business Association', 'business', 'contact@downtownbiz.org');

-- Sample data insertion for organizers (now linked to organizations)
INSERT INTO organizers (id, name, contact_info, organization_id) VALUES
(uuid_generate_v4(), 'Community Center', 'contact@communitycenter.org', (SELECT id FROM organizations WHERE name = 'City Recreation Department')),
(uuid_generate_v4(), 'Local Library', 'info@locallibrary.org', (SELECT id FROM organizations WHERE name = 'City Recreation Department')),
(uuid_generate_v4(), 'Sports Club', 'contact@sportsclub.org', (SELECT id FROM organizations WHERE name = 'Community Sports League')),
(uuid_generate_v4(), 'Music Hall', 'info@musichall.org', (SELECT id FROM organizations WHERE name = 'Cultural Arts Foundation')),
(uuid_generate_v4(), 'Art Gallery', 'contact@artgallery.org', (SELECT id FROM organizations WHERE name = 'Cultural Arts Foundation'));

-- Sample data insertion for venues (normalized from events)
INSERT INTO venues (id, name, address) VALUES
(uuid_generate_v4(), 'Community Center Main Hall', '123 Community Drive'),
(uuid_generate_v4(), 'Central Park Pavilion', 'Central Park, Section A'),
(uuid_generate_v4(), 'Library Conference Room', '456 Library Avenue'),
(uuid_generate_v4(), 'City Park Field', '789 Park Boulevard'),
(uuid_generate_v4(), 'Downtown Music Hall', '101 Arts District'),
(uuid_generate_v4(), 'Modern Art Gallery', '202 Gallery Row'),
(uuid_generate_v4(), 'Convention Center', '303 Convention Drive');

-- Sample data insertion for events (now with venue_id references)
INSERT INTO events (id, name, date, location, description, start_time, end_time, venue_id, organizer_id, capacity) VALUES
(uuid_generate_v4(), 'Community Potluck', NOW(), 'Central Park', 'Bring your favorite dish to share with your neighbors.', NOW() + INTERVAL '12 hours', NOW() + INTERVAL '14 hours', (SELECT id FROM venues WHERE name = 'Central Park Pavilion'), (SELECT id FROM organizers WHERE name = 'Community Center'), 50),
(uuid_generate_v4(), 'Book Club Meeting', NOW() - INTERVAL '1 day', 'Local Library', 'Discussing this month''s book: "The Great Gatsby".', (NOW() - INTERVAL '1 day') + INTERVAL '14 hours', (NOW() - INTERVAL '1 day') + INTERVAL '16 hours', (SELECT id FROM venues WHERE name = 'Library Conference Room'), (SELECT id FROM organizers WHERE name = 'Local Library'), 20),
(uuid_generate_v4(), 'Charity Run', NOW() + INTERVAL '1 month', 'City Park', 'Join us for a 5k run to raise money for local charities.', (NOW() + INTERVAL '1 month') + INTERVAL '9 hours', (NOW() + INTERVAL '1 month') + INTERVAL '12 hours', (SELECT id FROM venues WHERE name = 'City Park Field'), (SELECT id FROM organizers WHERE name = 'Sports Club'), 200),
(uuid_generate_v4(), 'Jazz Night', NOW() - INTERVAL '1 week', 'Downtown Music Hall', 'Enjoy an evening of live jazz music.', (NOW() - INTERVAL '1 week') + INTERVAL '19 hours', (NOW() - INTERVAL '1 week') + INTERVAL '22 hours', (SELECT id FROM venues WHERE name = 'Downtown Music Hall'), (SELECT id FROM organizers WHERE name = 'Music Hall'), 150),
(uuid_generate_v4(), 'Art Exhibition', NOW() - INTERVAL '2 weeks', 'Modern Art Gallery', 'Explore the latest works from contemporary artists.', (NOW() - INTERVAL '2 weeks') + INTERVAL '17 hours', (NOW() - INTERVAL '2 weeks') + INTERVAL '20 hours', (SELECT id FROM venues WHERE name = 'Modern Art Gallery'), (SELECT id FROM organizers WHERE name = 'Art Gallery'), 100),
(uuid_generate_v4(), 'Yoga Workshop', NOW() + INTERVAL '9 days', 'Community Center', 'A full-day workshop to enhance your yoga practice.', (NOW() + INTERVAL '9 days') + INTERVAL '8 hours', (NOW() + INTERVAL '9 days') + INTERVAL '17 hours', (SELECT id FROM venues WHERE name = 'Community Center Main Hall'), (SELECT id FROM organizers WHERE name = 'Community Center'), 30),
(uuid_generate_v4(), 'Cooking Class', NOW() - INTERVAL '17 days', 'Community Center', 'Learn to cook gourmet meals with our expert chefs.', (NOW() - INTERVAL '17 days') + INTERVAL '11 hours', (NOW() - INTERVAL '17 days') + INTERVAL '14 hours', (SELECT id FROM venues WHERE name = 'Community Center Main Hall'), (SELECT id FROM organizers WHERE name = 'Community Center'), 25),
(uuid_generate_v4(), 'Tech Conference', NOW() - INTERVAL '25 days', 'Convention Center', 'Join industry leaders to discuss the latest in technology.', (NOW() - INTERVAL '25 days') + INTERVAL '10 hours', (NOW() - INTERVAL '25 days') + INTERVAL '18 hours', (SELECT id FROM venues WHERE name = 'Convention Center'), (SELECT id FROM organizers WHERE name = 'Community Center'), 500),
(uuid_generate_v4(), 'Outdoor Concert', NOW() - INTERVAL '2 months', 'Downtown Music Hall', 'An evening of music under the stars.', (NOW() - INTERVAL '2 months') + INTERVAL '18 hours', (NOW() - INTERVAL '2 months') + INTERVAL '22 hours', (SELECT id FROM venues WHERE name = 'Downtown Music Hall'), (SELECT id FROM organizers WHERE name = 'Music Hall'), 300),
(uuid_generate_v4(), 'Photography Workshop', NOW() + INTERVAL '2 weeks', 'Modern Art Gallery', 'Improve your photography skills with hands-on training.', (NOW() + INTERVAL '2 weeks') + INTERVAL '9 hours', (NOW() + INTERVAL '2 weeks') + INTERVAL '17 hours', (SELECT id FROM venues WHERE name = 'Modern Art Gallery'), (SELECT id FROM organizers WHERE name = 'Art Gallery'), 15),
(uuid_generate_v4(), 'Film Festival', NOW() + INTERVAL '3 weeks', 'Modern Art Gallery', 'A weekend celebrating independent cinema with premieres and discussions.', (NOW() + INTERVAL '3 weeks') + INTERVAL '18 hours', (NOW() + INTERVAL '3 weeks') + INTERVAL '22 hours', (SELECT id FROM venues WHERE name = 'Modern Art Gallery'), (SELECT id FROM organizers WHERE name = 'Art Gallery'), 80),
(uuid_generate_v4(), 'Business Networking', NOW() + INTERVAL '5 days', 'Convention Center', 'Connect with local entrepreneurs and business leaders.', (NOW() + INTERVAL '5 days') + INTERVAL '17 hours', (NOW() + INTERVAL '5 days') + INTERVAL '21 hours', (SELECT id FROM venues WHERE name = 'Convention Center'), (SELECT id FROM organizers WHERE name = 'Community Center'), 250),
(uuid_generate_v4(), 'Food Festival', NOW() + INTERVAL '2 months', 'Central Park', 'Taste local cuisine from the best restaurants in town.', (NOW() + INTERVAL '2 months') + INTERVAL '11 hours', (NOW() + INTERVAL '2 months') + INTERVAL '20 hours', (SELECT id FROM venues WHERE name = 'Central Park Pavilion'), (SELECT id FROM organizers WHERE name = 'Community Center'), 400),
(uuid_generate_v4(), 'Marathon Training', NOW() + INTERVAL '6 weeks', 'City Park', 'Professional coaching session for marathon preparation.', (NOW() + INTERVAL '6 weeks') + INTERVAL '6 hours', (NOW() + INTERVAL '6 weeks') + INTERVAL '10 hours', (SELECT id FROM venues WHERE name = 'City Park Field'), (SELECT id FROM organizers WHERE name = 'Sports Club'), 100),
(uuid_generate_v4(), 'Wine Tasting', NOW() + INTERVAL '10 days', 'Downtown Music Hall', 'Sample premium wines from local vineyards with expert guidance.', (NOW() + INTERVAL '10 days') + INTERVAL '19 hours', (NOW() + INTERVAL '10 days') + INTERVAL '22 hours', (SELECT id FROM venues WHERE name = 'Downtown Music Hall'), (SELECT id FROM organizers WHERE name = 'Music Hall'), 40);

-- Sample ticket types data for tiered pricing
INSERT INTO ticket_types (event_id, tier_name, price, capacity, description) VALUES
-- Charity Run tickets
((SELECT id FROM events WHERE name = 'Charity Run'), 'Early Bird', 25.00, 100, 'Early registration discount - includes t-shirt'),
((SELECT id FROM events WHERE name = 'Charity Run'), 'Regular', 35.00, 200, 'Standard registration - includes t-shirt'),
((SELECT id FROM events WHERE name = 'Charity Run'), 'VIP', 75.00, 50, 'VIP package with premium t-shirt and post-race meal'),

-- Tech Conference tickets
((SELECT id FROM events WHERE name = 'Tech Conference'), 'Student', 50.00, 100, 'Student discount with valid ID'),
((SELECT id FROM events WHERE name = 'Tech Conference'), 'General', 150.00, 300, 'Full access to all sessions and networking'),
((SELECT id FROM events WHERE name = 'Tech Conference'), 'Premium', 300.00, 75, 'All access plus VIP networking dinner'),

-- Jazz Night tickets
((SELECT id FROM events WHERE name = 'Jazz Night'), 'General', 20.00, 150, 'General admission seating'),
((SELECT id FROM events WHERE name = 'Jazz Night'), 'Reserved', 35.00, 50, 'Reserved seating near the stage'),

-- Photography Workshop tickets
((SELECT id FROM events WHERE name = 'Photography Workshop'), 'Basic', 80.00, 20, 'Workshop materials included'),
((SELECT id FROM events WHERE name = 'Photography Workshop'), 'Premium', 120.00, 10, 'Workshop + equipment rental for the day'),

-- Yoga Workshop tickets
((SELECT id FROM events WHERE name = 'Yoga Workshop'), 'Single Session', 25.00, 30, 'Drop-in rate for single session'),
((SELECT id FROM events WHERE name = 'Yoga Workshop'), 'Full Day', 60.00, 25, 'All-day workshop with meals included'),

-- Film Festival tickets (multi-tier with free option)
((SELECT id FROM events WHERE name = 'Film Festival'), 'Free Screening', 0.00, 50, 'Free access to public screenings'),
((SELECT id FROM events WHERE name = 'Film Festival'), 'Day Pass', 25.00, 100, 'Access to all screenings for one day'),
((SELECT id FROM events WHERE name = 'Film Festival'), 'Weekend Pass', 45.00, 75, 'Full weekend access to all events'),
((SELECT id FROM events WHERE name = 'Film Festival'), 'VIP Pass', 85.00, 25, 'All access plus Q&A sessions and networking'),

-- Business Networking tickets (multi-tier with free option)
((SELECT id FROM events WHERE name = 'Business Networking'), 'Community Member', 0.00, 30, 'Free for local community members'),
((SELECT id FROM events WHERE name = 'Business Networking'), 'Professional', 50.00, 100, 'Standard networking access'),
((SELECT id FROM events WHERE name = 'Business Networking'), 'Premium', 100.00, 40, 'Includes dinner and executive roundtable'),

-- Food Festival tickets (multi-tier with free option)
((SELECT id FROM events WHERE name = 'Food Festival'), 'Free Entry', 0.00, 200, 'Free entry - food purchased separately'),
((SELECT id FROM events WHERE name = 'Food Festival'), 'Taste Package', 35.00, 150, 'Includes 10 tasting tickets'),
((SELECT id FROM events WHERE name = 'Food Festival'), 'Foodie Pass', 65.00, 75, 'Unlimited tastings and chef meet & greet'),

-- Marathon Training tickets (multi-tier)
((SELECT id FROM events WHERE name = 'Marathon Training'), 'Group Session', 15.00, 50, 'Group coaching session'),
((SELECT id FROM events WHERE name = 'Marathon Training'), 'Personal Training', 75.00, 10, 'One-on-one coaching session'),
((SELECT id FROM events WHERE name = 'Marathon Training'), 'Premium Package', 120.00, 5, 'Personal training plus nutrition consultation'),

-- Wine Tasting tickets (multi-tier with free option)
((SELECT id FROM events WHERE name = 'Wine Tasting'), 'Designated Driver', 0.00, 20, 'Free non-alcoholic beverages and food'),
((SELECT id FROM events WHERE name = 'Wine Tasting'), 'Standard Tasting', 45.00, 60, '6 wine samples with food pairings'),
((SELECT id FROM events WHERE name = 'Wine Tasting'), 'Premium Tasting', 85.00, 30, 'Premium wines and private sommelier session'),

-- Add free ticket types for remaining single-tier free events
((SELECT id FROM events WHERE name = 'Community Potluck'), 'Free Admission', 0.00, 200, 'Free community event'),
((SELECT id FROM events WHERE name = 'Book Club Meeting'), 'Free Admission', 0.00, 30, 'Free book discussion'),
((SELECT id FROM events WHERE name = 'Art Exhibition'), 'Free Admission', 0.00, NULL, 'Free gallery viewing'),
((SELECT id FROM events WHERE name = 'Cooking Class'), 'Free Admission', 0.00, 15, 'Free cooking lesson'),
((SELECT id FROM events WHERE name = 'Outdoor Concert'), 'Free Admission', 0.00, 500, 'Free outdoor music event');

-- Sample ticket purchases (financial transactions)
INSERT INTO ticket_purchases (user_id, ticket_type_id, quantity, amount_paid, payment_method, payment_status, payment_reference) VALUES
-- Paid purchases
((SELECT id FROM auth.users LIMIT 1 OFFSET 0), (SELECT id FROM ticket_types WHERE tier_name = 'Regular' AND event_id = (SELECT id FROM events WHERE name = 'Charity Run')), 1, 35.00, 'stripe', 'completed', 'pi_1234567890'),
((SELECT id FROM auth.users LIMIT 1 OFFSET 1), (SELECT id FROM ticket_types WHERE tier_name = 'VIP' AND event_id = (SELECT id FROM events WHERE name = 'Charity Run')), 1, 75.00, 'stripe', 'completed', 'pi_0987654321'),
((SELECT id FROM auth.users LIMIT 1 OFFSET 2), (SELECT id FROM ticket_types WHERE tier_name = 'General' AND event_id = (SELECT id FROM events WHERE name = 'Tech Conference')), 1, 150.00, 'paypal', 'completed', 'pp_123abc456'),
((SELECT id FROM auth.users LIMIT 1 OFFSET 3), (SELECT id FROM ticket_types WHERE tier_name = 'Student' AND event_id = (SELECT id FROM events WHERE name = 'Tech Conference')), 1, 50.00, 'stripe', 'completed', 'pi_student123'),

-- Free purchases (for free events)
((SELECT id FROM auth.users LIMIT 1 OFFSET 4), (SELECT id FROM ticket_types WHERE tier_name = 'Free Admission' AND event_id = (SELECT id FROM events WHERE name = 'Community Potluck')), 1, 0.00, 'free', 'completed', NULL),
((SELECT id FROM auth.users LIMIT 1 OFFSET 5), (SELECT id FROM ticket_types WHERE tier_name = 'Free Admission' AND event_id = (SELECT id FROM events WHERE name = 'Book Club Meeting')), 1, 0.00, 'free', 'completed', NULL),

-- Some pending/failed payments to show different statuses
((SELECT id FROM auth.users LIMIT 1 OFFSET 6), (SELECT id FROM ticket_types WHERE tier_name = 'Premium' AND event_id = (SELECT id FROM events WHERE name = 'Tech Conference')), 1, 300.00, 'stripe', 'pending', 'pi_pending123'),
((SELECT id FROM auth.users LIMIT 1 OFFSET 7), (SELECT id FROM ticket_types WHERE tier_name = 'Reserved' AND event_id = (SELECT id FROM events WHERE name = 'Jazz Night')), 1, 35.00, 'stripe', 'failed', 'pi_failed456'),

-- Add a refunded payment for demonstration
((SELECT id FROM auth.users LIMIT 1 OFFSET 8), (SELECT id FROM ticket_types WHERE tier_name = 'VIP' AND event_id = (SELECT id FROM events WHERE name = 'Charity Run')), 1, 75.00, 'stripe', 'refunded', 'pi_refunded789');

-- Create actual registrations linked to completed purchases
INSERT INTO registrations (user_id, event_id, ticket_purchase_id) VALUES
-- Paid registrations (linked to completed purchases)
((SELECT id FROM auth.users LIMIT 1 OFFSET 0), (SELECT id FROM events WHERE name = 'Charity Run'), (SELECT id FROM ticket_purchases WHERE payment_reference = 'pi_1234567890')),
((SELECT id FROM auth.users LIMIT 1 OFFSET 1), (SELECT id FROM events WHERE name = 'Charity Run'), (SELECT id FROM ticket_purchases WHERE payment_reference = 'pi_0987654321')),
((SELECT id FROM auth.users LIMIT 1 OFFSET 2), (SELECT id FROM events WHERE name = 'Tech Conference'), (SELECT id FROM ticket_purchases WHERE payment_reference = 'pp_123abc456')),
((SELECT id FROM auth.users LIMIT 1 OFFSET 3), (SELECT id FROM events WHERE name = 'Tech Conference'), (SELECT id FROM ticket_purchases WHERE payment_reference = 'pi_student123')),

-- Free registrations (linked to free purchases)
((SELECT id FROM auth.users LIMIT 1 OFFSET 4), (SELECT id FROM events WHERE name = 'Community Potluck'), (SELECT id FROM ticket_purchases WHERE payment_method = 'free' AND ticket_type_id = (SELECT id FROM ticket_types WHERE tier_name = 'Free Admission' AND event_id = (SELECT id FROM events WHERE name = 'Community Potluck')))),
((SELECT id FROM auth.users LIMIT 1 OFFSET 5), (SELECT id FROM events WHERE name = 'Book Club Meeting'), (SELECT id FROM ticket_purchases WHERE payment_method = 'free' AND ticket_type_id = (SELECT id FROM ticket_types WHERE tier_name = 'Free Admission' AND event_id = (SELECT id FROM events WHERE name = 'Book Club Meeting')))),

-- Refunded registration (shows completed purchase that was later refunded)
((SELECT id FROM auth.users LIMIT 1 OFFSET 8), (SELECT id FROM events WHERE name = 'Charity Run'), (SELECT id FROM ticket_purchases WHERE payment_reference = 'pi_refunded789'));

-- Note: No registrations for pending/failed payments - this demonstrates business rule enforcement