-- Insert sample vehicles
INSERT INTO vehicles (make, model, year, category, daily_rate, hourly_rate, status, features) VALUES
('Toyota', 'Corolla', 2023, 'economy', 25.00, 5.00, 'available', ARRAY['Air Conditioning', 'Bluetooth', 'Fuel Efficient']),
('Honda', 'Civic', 2023, 'compact', 35.00, 7.00, 'available', ARRAY['Air Conditioning', 'Bluetooth', 'Backup Camera']),
('Ford', 'Explorer', 2023, 'suv', 65.00, 12.00, 'available', ARRAY['4WD', 'Third Row Seating', 'Navigation System']),
('BMW', '3 Series', 2023, 'luxury', 120.00, 20.00, 'available', ARRAY['Leather Seats', 'Premium Sound', 'Sunroof']),
('Nissan', 'Sentra', 2022, 'economy', 23.00, 4.00, 'maintenance', ARRAY['Air Conditioning', 'Bluetooth', 'USB Ports']),
('Chevrolet', 'Tahoe', 2023, 'suv', 75.00, 14.00, 'available', ARRAY['8-Seater', '4WD', 'Entertainment System']),
('Audi', 'A4', 2023, 'luxury', 110.00, 18.00, 'available', ARRAY['Leather Seats', 'Navigation', 'Premium Sound']),
('Toyota', 'RAV4', 2023, 'suv', 55.00, 10.00, 'available', ARRAY['AWD', 'Safety Features', 'Cargo Space']),
('Honda', 'Accord', 2023, 'compact', 40.00, 8.00, 'rented', ARRAY['Air Conditioning', 'Bluetooth', 'Lane Assist']),
('Ford', 'Mustang', 2023, 'luxury', 95.00, 16.00, 'available', ARRAY['Sports Mode', 'Premium Audio', 'Performance Package']);

-- Insert sample bookings
INSERT INTO bookings (booking_id, customer_name, customer_email, customer_phone, vehicle_id, rental_type, rental_duration, pickup_date, return_date, total_price, status) VALUES
('BK001234', 'John Doe', 'john.doe@email.com', '+1-555-0101', 9, 'daily', 3, '2024-01-20 10:00:00', '2024-01-23 10:00:00', 120.00, 'active'),
('BK001235', 'Jane Smith', 'jane.smith@email.com', '+1-555-0102', 2, 'weekly', 1, '2024-01-15 09:00:00', '2024-01-22 09:00:00', 245.00, 'completed'),
('BK001236', 'Mike Johnson', 'mike.j@email.com', '+1-555-0103', 1, 'daily', 2, '2024-01-25 14:00:00', '2024-01-27 14:00:00', 50.00, 'confirmed');

-- Insert sample tracking data
INSERT INTO vehicle_tracking (vehicle_id, booking_id, latitude, longitude, address, speed) VALUES
(9, 'BK001234', 40.7128, -74.0060, 'New York, NY', 35),
(2, 'BK001235', 34.0522, -118.2437, 'Los Angeles, CA', 0),
(1, 'BK001236', 41.8781, -87.6298, 'Chicago, IL', 45);
