# Absence Management System - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Core Hours Config  │  Absence Management  │  Reports   │   │
│  │  PresenceBoard      │  (Enhanced)          │            │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (API Calls)
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Authentication & Authorization Middleware              │   │
│  │  (JWT Token + Role Verification)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Routes                              │   │
│  │  /api/core-hours  │  /api/absences  │  /api/reports     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                     Controllers                           │   │
│  │  - Business Logic                                        │   │
│  │  - Input Validation                                      │   │
│  │  - Error Handling                                        │   │
│  │  - Audit Logging                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Models/Database                        │   │
│  │  - CoreHours                                             │   │
│  │  - Absence                                               │   │
│  │  - Database Queries                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (SQL Queries)
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tables:                                                 │   │
│  │  ├─ core_hours                                           │   │
│  │  ├─ absences                                             │   │
│  │  ├─ absence_logs (audit trail)                           │   │
│  │  └─ (existing: users, attendance_sessions, etc.)         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Creating and Approving an Absence

```
STUDENT/MENTOR                FRONTEND               BACKEND              DATABASE
    │                           │                      │                    │
    │  Request Absence          │                      │                    │
    ├──────────────────────────→│                      │                    │
    │                           │  POST /api/absences  │                    │
    │                           ├─────────────────────→│                    │
    │                           │                      │ Validate Input     │
    │                           │                      │ Create Record      │
    │                           │                      ├───────────────────→│
    │                           │                      │                    │ INSERT
    │                           │                      │←───────────────────┤
    │                           │  Response (201)      │                    │
    │                           │←─────────────────────┤                    │
    │  Absence Created          │                      │                    │
    │←──────────────────────────┤                      │                    │
    │                           │                      │                    │
    │  Approve Absence          │                      │                    │
    ├──────────────────────────→│                      │                    │
    │                           │  PUT /api/absences   │                    │
    │                           ├─────────────────────→│                    │
    │                           │                      │ Validate Status    │
    │                           │                      │ Update Record      │
    │                           │                      ├───────────────────→│
    │                           │                      │                    │ UPDATE
    │                           │                      │ Create Audit Log   │
    │                           │                      ├───────────────────→│
    │                           │                      │                    │ INSERT
    │                           │  Response (200)      │                    │
    │                           │←─────────────────────┤                    │
    │  Approved Displayed       │                      │                    │
    │←──────────────────────────┤                      │                    │
```

### Generating Report

```
MENTOR/COACH                  FRONTEND              BACKEND              DATABASE
    │                           │                    │                    │
    │  Request Report           │                    │                    │
    │  (date range + type)      │                    │                    │
    ├──────────────────────────→│                    │                    │
    │                           │ GET /api/reports   │                    │
    │                           ├───────────────────→│                    │
    │                           │                    │ Query Date Range   │
    │                           │                    ├───────────────────→│
    │                           │                    │                    │ SELECT
    │                           │                    │                    │ (with audit join)
    │                           │                    │←───────────────────┤
    │                           │ Response (JSON)    │ Format Data        │
    │                           │ or File Stream     │ Build Report       │
    │                           │←───────────────────┤                    │
    │  Report Downloaded        │                    │                    │
    │  or Displayed             │                    │                    │
    │←──────────────────────────┤                    │                    │
```

### Audit Trail Creation

```
Whenever an absence is created or modified:

CONTROLLER                              DATABASE
    │                                    │
    │ 1. Insert/Update absence           │
    ├───────────────────────────────────→│
    │                                    │ UPDATE absences SET...
    │                                    │ or
    │                                    │ INSERT INTO absences...
    │                                    │
    │ 2. Create audit log entry          │
    ├───────────────────────────────────→│
    │                                    │ INSERT INTO absence_logs
    │                                    │ (absence_id, action, user_id, changes)
    │
    │ User can later query:
    │ GET /api/absences/:id/audit-log
    │
    └─→ Returns full history of all changes
        Including timestamps and user who made change
```

---

## Database Schema Details

### core_hours Table

```sql
CREATE TABLE core_hours (
    id UUID PRIMARY KEY,
    day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME,
    end_time TIME,
    type VARCHAR(50) DEFAULT 'required'
        CHECK (type IN ('required', 'suggested')),
    season_type VARCHAR(50) DEFAULT 'build'
        CHECK (season_type IN ('build', 'offseason')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_core_hours_day_season 
    ON core_hours(day_of_week, season_type);
```

### absences Table

```sql
CREATE TABLE absences (
    id UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES users(id),
    absence_date DATE NOT NULL,
    day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
    status VARCHAR(50) DEFAULT 'unapproved'
        CHECK (status IN ('approved', 'unapproved')),
    notes TEXT,
    approved_by UUID REFERENCES users(id),
    season_type VARCHAR(50) DEFAULT 'build'
        CHECK (season_type IN ('build', 'offseason')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, absence_date, season_type)
);

-- Indexes for common queries
CREATE INDEX idx_absences_student_id ON absences(student_id);
CREATE INDEX idx_absences_absence_date ON absences(absence_date);
CREATE INDEX idx_absences_status ON absences(status);
```

### absence_logs Table (Audit Trail)

```sql
CREATE TABLE absence_logs (
    id UUID PRIMARY KEY,
    absence_id UUID NOT NULL REFERENCES absences(id) ON DELETE CASCADE,
    action VARCHAR(50) CHECK (action IN ('created', 'updated')),
    user_id UUID NOT NULL REFERENCES users(id),
    changes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit queries
CREATE INDEX idx_absence_logs_absence_id ON absence_logs(absence_id);
```

---

## Code Organization

### Model Layer (backend/models)

**CoreHours.js**
- `create(dayOfWeek, startTime, endTime, type, seasonType)` → UUID
- `findBySeasonType(seasonType)` → Array[CoreHours]
- `findByDayAndSeason(dayOfWeek, seasonType)` → Array[CoreHours]
- `update(id, fields)` → CoreHours
- `delete(id)` → CoreHours

**Absence.js**
- `create(studentId, absenceDate, dayOfWeek, status, notes, approvedBy)` → UUID
- `findById(id)` → Absence
- `findByStudentAndDate(studentId, absenceDate)` → Absence
- `findUnapproved()` → Array[Absence]
- `update(id, status, notes, approvedBy)` → Absence
- `createAuditLog(absenceId, action, userId, changes)` → AuditLog
- `getAuditLog(absenceId)` → Array[AuditLog]
- `findForReport(startDate, endDate, seasonType)` → Array[Absence with student info]

### Controller Layer (backend/controllers)

**coreHoursController.js**
- `createCoreHours()` - POST handler
- `getCoreHoursBySeasonType()` - GET handler with filter
- `getCoreHoursByDay()` - GET handler for specific day
- `getAllCoreHours()` - GET handler
- `updateCoreHours()` - PUT handler
- `deleteCoreHours()` - DELETE handler

**absenceController.js**
- `createAbsence()` - POST handler with validation
- `getAbsenceById()` - GET handler
- `getUnapprovedAbsences()` - GET handler
- `getStudentAbsences()` - GET handler with date range
- `updateAbsence()` - PUT handler with audit logging
- `getAuditLog()` - GET handler
- `getFutureAbsences()` - GET handler

**reportController.js**
- `getAttendanceReportCSV()` - CSV export
- `getDetailedAuditReport()` - Text report with full audit trail
- `getAttendanceSummary()` - JSON summary for web
- `getFutureAbsencesSummary()` - Future absences list

### Route Layer (backend/routes)

**coreHours.js**
- Routes all core hours endpoints
- Applies authentication middleware

**absences.js**
- Routes all absence endpoints
- Applies authentication middleware

**reports.js**
- Routes all reporting endpoints
- Applies authentication middleware

---

## Authentication & Authorization Flow

```
1. User logs in via Kiosk with PIN
   ↓
2. Backend verifies credentials
   ↓
3. JWT token issued
   ↓
4. Token stored in localStorage (frontend)
   ↓
5. All API requests include token in Authorization header
   ↓
6. Backend middleware verifies token
   ↓
7. User role checked (must be 'mentor' or 'coach' for absence management)
   ↓
8. If authorized: request processed
   If unauthorized: 401/403 error returned
```

---

## Error Handling

### Validation Errors
```
Status: 400 Bad Request
Body: { error: "Descriptive message" }
```

### Not Found Errors
```
Status: 404 Not Found
Body: { error: "Resource not found" }
```

### Authentication Errors
```
Status: 401 Unauthorized
Body: { error: "Authentication required" }
```

### Authorization Errors
```
Status: 403 Forbidden
Body: { error: "Insufficient permissions" }
```

### Server Errors
```
Status: 500 Internal Server Error
Body: { error: "Internal server error" }
```

---

## Performance Considerations

### Database Indexes
- **core_hours**: Indexed on (day_of_week, season_type) for fast schedule lookups
- **absences**: Indexed on student_id, absence_date, and status for common queries
- **absence_logs**: Indexed on absence_id for audit trail retrieval

### Query Optimization
- Uses JOIN with users table to avoid N+1 queries
- Uses JSONB for flexible audit trail storage
- Soft deletes prevent unnecessary cascade operations

### Caching Opportunities (Future)
- Core hours could be cached (updated infrequently)
- Presence board could cache 24-hour results
- Reports could be generated asynchronously for large date ranges

---

## Frontend Component Structure

### AbsenceManagement.jsx
- State management for absences list
- Form handling for creating/editing absences
- Real-time status updates
- Audit log viewer modal

### CoreHoursConfig.jsx
- State management for core hours
- Season type selector
- Schedule grid display
- Form for adding/editing hours

### ReportingPage.jsx
- Date range picker
- Report type selector (summary/CSV/audit)
- Data display in table format
- File download handlers

### Enhanced PresenceBoard.jsx
- Integrates absence data
- Green highlighting for excused absences
- Badge display for status

---

## API Response Patterns

### Success Response
```json
{
  "id": "uuid",
  "field1": "value",
  "field2": "value",
  "created_at": "2026-01-13T10:15:00.000Z"
}
```

### List Response
```json
[
  { "id": "uuid1", ... },
  { "id": "uuid2", ... }
]
```

### Error Response
```json
{
  "error": "Human readable error message"
}
```

### Audit Response
```json
{
  "absenceId": "uuid",
  "logs": [
    {
      "action": "created|updated",
      "user_alias": "string",
      "created_at": "timestamp",
      "changes": { ... }
    }
  ]
}
```

---

## Deployment Considerations

### Environment Variables Needed
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=robotics_attendance
DB_USER=postgres
DB_PASSWORD=*****
NODE_ENV=production
PORT=3000
```

### Security Headers (if using reverse proxy)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000

### Database Backups
- Backup before major updates
- Retention policy for audit logs
- Point-in-time recovery capability

---

## Monitoring & Logging

### Key Metrics to Track
- API response times
- Database query performance
- Audit log volume
- Report generation time
- Error rates by endpoint

### Logging Points
- Absence creation/update (with full context)
- Report generation requests
- Authentication failures
- Database errors

---

## Future Scalability

### Potential Improvements
1. **Caching Layer** (Redis) for frequently accessed core hours
2. **Message Queue** (RabbitMQ) for async report generation
3. **Search Service** (Elasticsearch) for advanced filtering
4. **File Storage** (S3) for large report archival
5. **API Pagination** for large result sets
6. **GraphQL** endpoint for flexible queries

---

This technical architecture ensures the system is maintainable, scalable, and follows industry best practices for web applications.
