# Robotics Attendance System

A web-based attendance and reflection system for robotics programs, with kiosk check-in, presence board, and admin dashboard.

---

## Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **npm** (included with Node.js)

---

## Environment Setup

### 1. Database

Create a PostgreSQL database and user:

```sql
CREATE USER attendance_user WITH PASSWORD 'admin';
CREATE DATABASE attendance OWNER attendance_user;
```

Or use your own credentials and update `.env` accordingly.

### 2. Backend Environment

Navigate to the backend folder and create a `.env` file:

```bash
cd backend
```

Create/edit `backend/.env`:

```
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=attendance
DB_USER=attendance_user
DB_PASSWORD=admin

# JWT Authentication
JWT_SECRET=your-strong-secret-key-change-this
JWT_EXPIRES_IN=12h
```

**Important:** Replace `your-strong-secret-key-change-this` with a strong, random secret (e.g., 32+ character random string).

---

## Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## Database Initialization

Initialize the database schema (run once):

```bash
cd backend
node scripts/initDatabase.js
```

Seed with sample data (students, mentors, coaches):

```bash
node scripts/seedDatabase.js
```

**Sample Login Credentials** (from seeding):
- **Student:** `jdoe` / PIN: `1234`
- **Student:** `jsmith` / PIN: `5678`
- **Mentor:** `bjohnson` / PIN: `9999`
- **Coach:** `awilliams` / PIN: `0000`

---

## Running the Application

### Start Backend

```bash
cd backend
npm start
```

Expected output:
```
🚀 Robotics Attendance System API running on port 3000
Environment: development
Health check: http://localhost:3000/health
```

### Start Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173** in your browser.

---

## API Overview

### Health Check (No Auth Required)

```
GET /health
```

Response:
```json
{ "status": "ok", "timestamp": "2026-01-01T12:00:00.000Z" }
```

### Authentication

#### Login (No Auth Required)

```
POST /auth/login
```

Request:
```json
{ "alias": "jdoe", "pin": "1234" }
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "alias": "jdoe",
    "role": "student",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Use the token for protected routes:**
- Header: `Authorization: Bearer <token>`

---

### Kiosk (No Auth Required)

#### Check-In

```
POST /kiosk/check-in
```

Request:
```json
{ "alias": "jdoe", "pin": "1234" }
```

#### Check-Out

```
POST /kiosk/check-out
```

Request:
```json
{
  "alias": "jdoe",
  "pin": "1234",
  "reflectionText": "I learned about motor control today."
}
```

#### Get Active Users

```
GET /kiosk/users
```

#### Get Reflection Prompt

```
GET /kiosk/reflection-prompt
```

---

### Users (Auth Required: Mentor/Coach)

#### Get All Users

```
GET /users
Authorization: Bearer <token>
```

#### Create User

```
POST /users
Authorization: Bearer <token>
```

Request:
```json
{
  "firstName": "Alice",
  "lastName": "Brown",
  "alias": "abrown",
  "role": "student",
  "pin": "4567"
}
```

#### Get User by ID

```
GET /users/<userId>
Authorization: Bearer <token>
```

#### Update User

```
PATCH /users/<userId>
Authorization: Bearer <token>
```

Request (any of these fields):
```json
{ "firstName": "Alice", "lastName": "Brown" }
```

#### Update User Alias

```
PATCH /users/<userId>/alias
Authorization: Bearer <token>
```

Request:
```json
{ "alias": "abrown123" }
```

#### Update User PIN (Coach Only)

```
PATCH /users/<userId>/pin
Authorization: Bearer <token>
```

Request:
```json
{ "pin": "9999" }
```

#### Delete User (Coach Only)

```
DELETE /users/<userId>
Authorization: Bearer <token>
```

---

### Attendance (Auth Required: Mentor/Coach)

#### Get Daily Attendance

```
GET /attendance/day?date=2026-01-01
Authorization: Bearer <token>
```

#### Get User Attendance History

```
GET /attendance/user/<userId>
Authorization: Bearer <token>
```

#### Export Attendance (CSV)

```
GET /attendance/export?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <token>
```

---

### Presence Board (Auth Required: Mentor/Coach)

#### Get Current Presence

```
GET /presence/current
Authorization: Bearer <token>
```

---

### Parent Contacts (Auth Required: Mentor/Coach)

#### Get User Contacts

```
GET /users/<userId>/contacts
Authorization: Bearer <token>
```

#### Add Contact

```
POST /users/<userId>/contacts
Authorization: Bearer <token>
```

Request:
```json
{
  "name": "Jane Doe (Parent)",
  "phoneNumber": "555-1234",
  "relationship": "Parent"
}
```

---

### Reflections (Auth Required: Mentor/Coach)

#### Get All Reflections

```
GET /reflections
Authorization: Bearer <token>
```

#### Get User Reflections

```
GET /reflections/user/<userId>
Authorization: Bearer <token>
```

---

### Settings (Auth Required: Mentor/Coach)

#### Get Settings

```
GET /settings
Authorization: Bearer <token>
```

#### Update Settings (Coach Only)

```
PATCH /settings
Authorization: Bearer <token>
```

Request:
```json
{
  "reflectionPrompt": "What did you accomplish today?"
}
```

---

## Role Permissions

- **Student:** Check in/out, submit reflections, view own data.
- **Mentor:** All student permissions + manage students, view attendance, manage contacts.
- **Coach:** All mentor permissions + manage mentors, reset PINs, delete users, update system settings.

---

## Features

- Student/Mentor check-in and check-out
- Reflection collection at checkout
- Real-time presence board
- Parent/Guardian contact management
- Attendance history tracking
- PIN-based authentication
- JWT-based API authentication
- Role-based access control (Student, Mentor, Coach)
- Request validation with express-validator
- Audit logging
- CSV attendance export
