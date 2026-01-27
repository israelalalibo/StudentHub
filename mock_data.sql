-- Mock Data for StudentHub ProductTable
-- 50 Random Student Items
-- Using 3 seller IDs distributed randomly

INSERT INTO "ProductTable" (title, description, price, image_url, category, condition, seller_id) VALUES

-- TEXTBOOKS (15 items)
('Calculus: Early Transcendentals 8th Edition', 'James Stewart calculus textbook. Some highlighting in chapters 1-5, otherwise great condition. Access code NOT included.', 45.00, NULL, 'Textbooks', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Introduction to Psychology 11th Edition', 'Barely used psychology textbook. Perfect for PSY 101. No markings or damage.', 65.00, NULL, 'Textbooks', 'Like New', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Organic Chemistry 3rd Edition', 'Klein Organic Chemistry. Has some notes in margins but all pages intact. Great study resource!', 55.00, NULL, 'Textbooks', 'Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Principles of Economics by Mankiw', 'Microeconomics textbook, 9th edition. Minor wear on cover, pages are clean.', 40.00, NULL, 'Textbooks', 'Very Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Biology: The Core 3rd Edition', 'Eric Simon biology textbook. Some water damage on back cover but content is fine.', 25.00, NULL, 'Textbooks', 'Acceptable', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Data Structures and Algorithms in Java', 'Great CS textbook, 6th edition. No markings, binding intact.', 70.00, NULL, 'Textbooks', 'Very Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('The Norton Anthology of English Literature', 'Volume 1, 10th edition. Required for ENG 201. Minor highlighting.', 35.00, NULL, 'Textbooks', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Physics for Scientists and Engineers', 'Serway & Jewett, 10th edition. Comes with unused access code!', 120.00, NULL, 'Textbooks', 'Like New', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Fundamentals of Nursing 10th Edition', 'Potter & Perry nursing textbook. Some tabs and highlights, great condition overall.', 85.00, NULL, 'Textbooks', 'Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Discrete Mathematics and Its Applications', 'Kenneth Rosen, 8th edition. Essential for CS majors. Clean copy.', 60.00, NULL, 'Textbooks', 'Very Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Spanish for Beginners Workbook', 'Includes audio CD. Perfect for SPA 101/102. Never written in.', 20.00, NULL, 'Textbooks', 'Like New', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Art History Volume 1 - 6th Edition', 'Marilyn Stokstad. Heavy book but great pictures. Some wear on spine.', 50.00, NULL, 'Textbooks', 'Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Financial Accounting 17th Edition', 'Williams/Haka. Business major essential. Clean, no markings.', 75.00, NULL, 'Textbooks', 'Very Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Human Anatomy & Physiology', 'Marieb & Hoehn, 11th edition. Includes lab manual. Great for pre-med.', 95.00, NULL, 'Textbooks', 'Good', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Introduction to Algorithms 4th Edition', 'CLRS - the bible for CS students. Pristine condition.', 110.00, NULL, 'Textbooks', 'Like New', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),

-- ELECTRONICS (12 items)
('Apple MacBook Air M1 2020', 'Space Gray, 256GB SSD, 8GB RAM. Battery health 92%. Comes with charger.', 650.00, NULL, 'Electronics', 'Very Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('iPad Pro 11" 2021 with Apple Pencil', '128GB WiFi model. Perfect for note-taking. Screen protector included.', 550.00, NULL, 'Electronics', 'Very Good', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Sony WH-1000XM4 Headphones', 'Noise cancelling headphones. Black color. Amazing for studying in loud spaces.', 180.00, NULL, 'Electronics', 'Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Texas Instruments TI-84 Plus CE', 'Graphing calculator in blue. Required for many math classes. Works perfectly.', 75.00, NULL, 'Electronics', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Logitech MX Master 3 Mouse', 'Ergonomic wireless mouse. Great for long study sessions. Like new condition.', 65.00, NULL, 'Electronics', 'Like New', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Dell 27" Monitor 1080p', 'Great second monitor for your dorm setup. HDMI cable included.', 120.00, NULL, 'Electronics', 'Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Kindle Paperwhite 2021', '8GB model with case. Perfect for reading assignments on the go.', 85.00, NULL, 'Electronics', 'Very Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Anker USB-C Hub 7-in-1', 'Essential for MacBook users. HDMI, USB-A, SD card slots.', 30.00, NULL, 'Electronics', 'Like New', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Mechanical Keyboard - Keychron K2', 'Wireless mechanical keyboard with brown switches. Great for coding.', 55.00, NULL, 'Electronics', 'Very Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Desk Lamp with USB Charging Port', 'LED desk lamp with adjustable brightness. Perfect for late night studying.', 25.00, NULL, 'Electronics', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Portable Phone Charger 20000mAh', 'Anker power bank. Charges phone 4-5 times. Essential for long library days.', 28.00, NULL, 'Electronics', 'Like New', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('HP LaserJet Printer', 'Black and white laser printer. Still has toner. Perfect for printing assignments.', 80.00, NULL, 'Electronics', 'Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),

-- FURNITURE (8 items)
('IKEA ALEX Desk - White', '131cm desk with drawers. Great condition, some minor scratches. Must pick up.', 95.00, NULL, 'Furniture', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Ergonomic Office Chair', 'Mesh back office chair with lumbar support. Adjustable height. Black.', 120.00, NULL, 'Furniture', 'Very Good', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Bookshelf 5-Tier', 'White wooden bookshelf. Perfect for textbooks and decor. Easy assembly.', 45.00, NULL, 'Furniture', 'Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Mini Fridge 3.2 cu ft', 'Black mini fridge perfect for dorm room. Freezer compartment included.', 75.00, NULL, 'Furniture', 'Very Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Futon Sofa Bed - Gray', 'Converts from sofa to bed. Great for small apartments. Comfortable!', 150.00, NULL, 'Furniture', 'Good', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Standing Desk Converter', 'Adjustable sit-stand desk riser. Fits on existing desk. Ergonomic!', 85.00, NULL, 'Furniture', 'Like New', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Bedside Table with Drawer', 'White nightstand. Perfect size for dorm. Lamp and books fit on top.', 30.00, NULL, 'Furniture', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Full Size Mattress - Memory Foam', '10" memory foam mattress. Used for one semester. Very comfortable.', 180.00, NULL, 'Furniture', 'Very Good', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),

-- CLOTHING (5 items)
('University Hoodie - Size L', 'Official university merchandise. Navy blue. Worn a few times, still great.', 35.00, NULL, 'Clothing', 'Very Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('North Face Backpack', '28L backpack in black. Multiple compartments, laptop sleeve. Great for campus.', 65.00, NULL, 'Clothing', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Business Casual Blazer - Size M', 'Navy blue blazer perfect for presentations and interviews.', 45.00, NULL, 'Clothing', 'Like New', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Winter Jacket - Patagonia', 'Women size S. Super warm puffer jacket. Moving somewhere warm!', 120.00, NULL, 'Clothing', 'Very Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Running Shoes Nike - Size 10', 'Used for one semester of gym class. Still have lots of life left.', 40.00, NULL, 'Clothing', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),

-- SPORTS & FITNESS (5 items)
('Yoga Mat with Carrying Strap', 'Purple 6mm thick yoga mat. Used in campus yoga classes. Clean!', 20.00, NULL, 'Sports & Fitness', 'Good', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Adjustable Dumbbells Set', 'Bowflex-style adjustable dumbbells 5-25lbs. Perfect for dorm workouts.', 150.00, NULL, 'Sports & Fitness', 'Very Good', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Road Bike - Schwinn', '21-speed road bike. Great for commuting to campus. Lock included.', 220.00, NULL, 'Sports & Fitness', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Tennis Racket Wilson', 'Used for one season of intramural tennis. Comes with 3 balls.', 45.00, NULL, 'Sports & Fitness', 'Good', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Resistance Bands Set', '5 bands with different resistance levels. Great for home workouts.', 15.00, NULL, 'Sports & Fitness', 'Like New', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),

-- OTHER (5 items)
('Coffee Maker - Keurig Mini', 'Single serve coffee maker. Essential for early morning classes!', 50.00, NULL, 'Other', 'Very Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Scientific Calculator Casio', 'FX-991EX. Advanced scientific calculator. Great for engineering students.', 25.00, NULL, 'Other', 'Good', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7'),
('Desk Organizer Set', 'Bamboo desk organizer with pen holder, letter tray, and drawer.', 28.00, NULL, 'Other', 'Like New', 'db55444e-74d0-4b39-8dbb-ed5725f75b85'),
('Whiteboard 24x36 inches', 'Magnetic whiteboard with markers and eraser. Great for study groups.', 35.00, NULL, 'Other', 'Good', '9dbbfb6a-63c1-4f09-95c2-80f97b470ac1'),
('Instant Pot Duo 6qt', 'Barely used pressure cooker. Make easy meals in your apartment!', 60.00, NULL, 'Other', 'Like New', 'ce2e61ed-4563-48d0-b5ed-820753d9e5f7');

-- Verify insertion
SELECT COUNT(*) as total_products FROM "ProductTable";

-- Check distribution by seller
SELECT seller_id, COUNT(*) as items_count 
FROM "ProductTable" 
GROUP BY seller_id;
