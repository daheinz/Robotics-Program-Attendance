# Absence Management System - Implementation Guide

## Overview
This guide covers the new Absence Management and Core Hours Configuration features added to the Robotics Attendance System.

## Features Implemented

### 1. Core Hours Management
- **Location**: `/core-hours` page
- **Features**:
  - Define required and suggested attendance times for different days
  - Support for multiple seasons (Build Season, Off-Season)
  - Configure separate schedules per season
  - Edit and delete core hours entries
  - Visual schedule display grouped by day

### 2. Absence Management
- **Location**: `/absences` page
- **Features**:
  - Record absence requests from students
  - View unapproved and future absences
  - Approve/reject absences with required notes
  - Edit approved absence records
  - Full audit trail of all absence modifications
  - Mentor/Coach approval workflow

### 3. Reporting & Analytics
- **Location**: `/reports` page
- **Features**:
  - Generate attendance summary reports (web display)
  - Download reports as CSV for spreadsheet analysis
  - Download detailed audit reports (text format) showing full edit history
  - View future scheduled absences
  - Filter by date range and season type

### 4. Enhanced Presence Board
- **Location**: `/presence` page
- **Updated Features**:
  - Shows excused absences in green color
  - Displays "Excused Absence" badge for students with approved absences
  - Updated legend showing excused absence indicator
  - Real-time sync with absence records

## Database Schema

### Tables Created

#### `core_hours`
```sql
- id (UUID, PK)
- day_of_week (INT: 0-6 for Sun-Sat)
- start_time (TIME)
- end_time (TIME)
- type (VARCHAR: 'required' or 'suggested')
- season_type (VARCHAR: 'build' or 'offseason')
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `absences`
```sql
- id (UUID, PK)
- student_id (UUID, FK to users)
- absence_date (DATE)
- day_of_week (INT: 0-6)
- status (VARCHAR: 'approved' or 'unapproved')
- notes (TEXT) - Required, visible only to mentors/coaches
- approved_by (UUID, FK to users)
- season_type (VARCHAR: 'build' or 'offseason')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(student_id, absence_date, season_type)
```

#### `absence_logs`
```sql
- id (UUID, PK)
- absence_id (UUID, FK to absences) - CASCADE DELETE
- action (VARCHAR: 'created' or 'updated')
- user_id (UUID, FK to users)
- changes (JSONB) - Tracks what was changed
- created_at (TIMESTAMP)
```

## Setup Instructions

### 1. Create Database Tables
Run the migration script:
```bash
node backend/scripts/createAbsenceTables.js
```

This creates all necessary tables and indexes.

### 2. Verify API Endpoints
The following endpoints are now available:

**Core Hours:**
- `POST /api/core-hours` - Create new core hours
- `GET /api/core-hours` - Get all core hours
- `GET /api/core-hours?seasonType=build` - Filter by season
- `GET /api/core-hours/day/:dayOfWeek` - Get specific day's hours
- `PUT /api/core-hours/:id` - Update core hours
- `DELETE /api/core-hours/:id` - Delete core hours

**Absences:**
- `POST /api/absences` - Create absence record
- `GET /api/absences/unapproved` - Get unapproved absences
- `GET /api/absences/future` - Get future absences
- `GET /api/absences/:id` - Get specific absence
- `GET /api/absences/:id/audit-log` - Get audit trail
- `GET /api/absences/student/:studentId` - Get student absences
- `PUT /api/absences/:id` - Approve/update absence

**Reports:**
- `GET /api/reports/attendance` - Get summary (JSON)
- `GET /api/reports/attendance-csv` - Download CSV
- `GET /api/reports/audit` - Download audit report
- `GET /api/reports/future` - Get future absences

### 3. Update Frontend Navigation
The new pages are already added to the mentor/coach dashboard:
- ⏰ Core Hours Configuration
- 📋 Absence Management
- 📊 Reports & Analytics
- 👥 Presence Board (updated)

## Usage Workflow

### Setting Up Core Hours (First Time)
1. Login as Mentor/Coach
2. Click "Core Hours Configuration"
3. Select Season Type (Build/Off-Season)
4. Click "Add Core Hours"
5. Configure each day:
   - Monday: 5:30 PM - 8:00 PM (Required)
   - Friday: 3:30 PM - 8:30 PM (Required)
   - Saturday: 10:00 AM - 4:00 PM (Required)
6. Save

### Recording Absences
1. Login as Mentor/Coach
2. Click "Absence Management"
3. Click "Record New Absence"
4. Select student and date
5. Enter required notes explaining the absence
6. Mark as Approved/Unapproved
7. Save (automatically logs who approved it and when)

### Approving Pending Absences
1. Login as Mentor/Coach
2. Click "Absence Management"
3. Filter shows "Unapproved" absences by default
4. Click "Approve" button on each absence
5. Or click "Edit" to modify approval status or notes
6. View audit trail by clicking "Audit" button

### Generating Reports
1. Login as Mentor/Coach
2. Click "Reports & Analytics"
3. Select date range
4. Choose action:
   - "View Summary" - See in browser
   - "Download CSV" - Export for Excel/Sheets
   - "Download Audit Report" - Full edit history
   - "View Future Absences" - Upcoming scheduled absences

### Viewing Presence Board
1. Login as Mentor/Coach
2. Click "Presence Board" or navigate to `/presence`
3. Students with excused absences show in green with badge
4. Timeline shows check-in/out bars as usual
5. Board updates automatically every 30 seconds

## Important Notes

### Compliance Rules
Students must be onsite during entire required core hours block MINUS 30 minutes total gap time:
- Arriving 30 min late = acceptable (if leaves on time)
- Leaving 30 min early = acceptable (if arrives on time)
- Both arriving late AND leaving early = unexcused absence
- Can leave for lunch (up to 1 hour break within the block is allowed)
- Mentors/Coaches can override with excused absence approval

### Timezone
All times configured for **CST (Central Standard Time)**

### Required Fields
- **Notes**: Required when recording any absence. Must document reason/circumstances.
- **Approval Date**: Automatically set when recording absence
- **Approver**: Automatically captures which mentor/coach made the decision

### Audit Trail
Every absence approval/modification creates an audit log entry showing:
- Who made the change (mentor/coach alias)
- When the change was made
- What specifically changed (old value → new value)
- Full history visible in audit reports

### Permissions
- **Mentors/Coaches**: Can create, edit, approve all student absences; view all reports
- **Students**: Can view their own attendance data (via StudentDashboard)
- **Admin**: Full system access (via AdminDashboard)

## Testing Checklist

### Core Hours Setup
- [ ] Create core hours for each day
- [ ] Edit core hours entry
- [ ] Delete core hours entry
- [ ] Switch between build/offseason seasons
- [ ] Verify correct times display

### Absence Recording
- [ ] Record absence for future date
- [ ] Approve absence with notes
- [ ] View unapproved absences
- [ ] Edit approved absence
- [ ] View audit log shows all changes

### Reporting
- [ ] Generate summary report (visible in browser)
- [ ] Download attendance CSV
- [ ] Download audit report (shows full history)
- [ ] View future absences list
- [ ] Verify date filtering works

### Presence Board
- [ ] Student with excused absence shows in green
- [ ] Badge displays "Excused Absence"
- [ ] Legend updated with green indicator
- [ ] Regular check-ins still display as normal

### Error Handling
- [ ] Cannot create duplicate absence for same student/date
- [ ] Cannot create core hours with start_time > end_time
- [ ] Notes field is required when creating absence
- [ ] Date validation prevents past dates in some contexts
- [ ] Student selection is required

## Future Enhancements

1. **Notifications**: Email/SMS when absences are approved/denied
2. **Absence Tracking**: Automatic flagging when students exceed absence threshold
3. **Student Portal**: Allow students to request absences themselves
4. **Compliance Reports**: Generate compliance warnings after X unapproved absences
5. **Recurring Absences**: Support for multi-day absence requests
6. **Substitute Coverage**: Track when alternate students cover for absent roles

## Troubleshooting

### Database Tables Not Created
- Run: `node backend/scripts/createAbsenceTables.js`
- Verify PostgreSQL connection is active
- Check database user permissions

### Absences Not Showing on Presence Board
- Verify absence record has `absence_date` = today
- Check `status` = "approved"
- Ensure `student_id` matches user ID
- Verify core hours are set for today's day of week

### Reports Download Not Working
- Check browser console for errors
- Verify date range is valid
- Ensure reports API endpoint is accessible
- Try JSON view first, then CSV download

### API Endpoint Errors
- Verify authentication token is valid
- Check user role is 'mentor' or 'coach'
- Verify request body parameters match schema
- Check database indexes are created

## Support

For issues or questions:
1. Check the error messages in browser console
2. Review API response status codes
3. Verify database connectivity
4. Check that all tables are created (run migration script)
5. Review audit logs for any approval issues
