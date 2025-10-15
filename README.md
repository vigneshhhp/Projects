# Vehicle Service Management System

Full-stack app using Node.js (Express), MySQL, and vanilla JS/HTML/CSS.

## Setup

1) Requirements
- Node.js 18+
- PostgreSQL 13+

2) Create database and tables (MySQL)

Create a DB (e.g., `vehicle_service_db`), then run the SQL in MySQL:

```sql
-- server/sql/schema.sql
CREATE TABLE IF NOT EXISTS customer (
  customer_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone_no VARCHAR(15) NOT NULL,
  address TEXT,
  password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle (
  vehicle_id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customer(customer_id) ON DELETE CASCADE,
  vehicle_type VARCHAR(50),
  license_no VARCHAR(20) UNIQUE NOT NULL,
  year INTEGER,
  brand VARCHAR(50),
  model VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS service (
  service_id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicle(vehicle_id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'Scheduled'
);
```

3) Configure environment

Create a `.env` file in the project root:

```
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/vehicle_service_db
JWT_SECRET=change_this_secret
MYSQL_SSL=false
```

4) Install and run

```
npm install
npm start
```

Then open `http://localhost:3000`.

## API Overview

- POST `/api/auth/register` { name, email, phone_no, address?, password }
- POST `/api/auth/login` { email, password }
- GET `/api/customer/profile` (Bearer token)
- PUT `/api/customer/profile` (Bearer token)
- POST `/api/vehicles` (Bearer token)
- GET `/api/vehicles` (Bearer token)
- PUT `/api/vehicles/:vehicle_id` (Bearer token)
- DELETE `/api/vehicles/:vehicle_id` (Bearer token)
- GET `/api/services/vehicle/:vehicle_id` (Bearer token)
- POST `/api/services/vehicle/:vehicle_id` (Bearer token)

## Frontend

- `public/index.html`: Login/Register
- `public/dashboard.html`: Protected dashboard
- `public/script.js`: Vanilla JS with fetch, JWT in localStorage, modals, and spinner
- `public/style.css`: Responsive layout with Flex/Grid


# Projects
