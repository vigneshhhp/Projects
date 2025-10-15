-- MySQL schema for Vehicle Service Management System

CREATE TABLE IF NOT EXISTS customer (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone_no VARCHAR(15) NOT NULL,
  address TEXT,
  password_hash VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle (
  vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  vehicle_type VARCHAR(50),
  license_no VARCHAR(20) NOT NULL UNIQUE,
  year INT,
  brand VARCHAR(50),
  model VARCHAR(50),
  CONSTRAINT fk_vehicle_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS service (
  service_id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT,
  service_date DATE NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Scheduled',
  CONSTRAINT fk_service_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE
) ENGINE=InnoDB;


