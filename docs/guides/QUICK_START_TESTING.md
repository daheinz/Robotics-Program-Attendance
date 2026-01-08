# Quick Start Guide - Testing Absence Management

## Prerequisites
- Node.js and npm installed
- PostgreSQL running and connected
- Backend server running on port 3000
- Frontend running on port 5173 (default Vite)

## Step 1: Initialize Database
```bash
cd backend
node scripts/createAbsenceTables.js
```

Expected output:
```
Creating core_hours table...
✓ core_hours table created
Creating absences table...
✓ absences table created
Creating absence_logs table...
✓ absence_logs table created
Creating indexes...
✓ Indexes created
✓ All tables created successfully!
```

## Step 2: Start Backend & Frontend
```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

## Step 3: Login to System
1. Navigate to http://localhost:5173 (or Vite dev URL)
2. Use kiosk login as a mentor/coach account
   - Alias: [mentor/coach username from database]
   - PIN: [mentor/coach PIN]

## Step 4: Test Core Hours Setup
1. After login, click "Core Hours Configuration" 
2. Select "Build Season"
3. Click "Add Core Hours"
4. Add Monday session:
   - Day: Monday
   - Start: 17:30
   - End: 20:00
   - Type: Required
5. Click "Add"
6. Repeat for Friday (15:30-20:30) and Saturday (10:00-16:00)

Expected: All three days appear in grid view

## Step 5: Test Absence Recording
1. Click "Absence Management"
2. Select "Unapproved" filter (should show 0 initially)
3. Click "Record New Absence"
4. Fill form:
   - Student: [Select any student]
   - Date: [Future date that matches one of your core hours days]
   - Status: Unapproved
   - Notes: "Medical appointment"
5. Click "Record Absence"

Expected: Absence appears in list with status "UNAPPROVED"

## Step 6: Test Approval Workflow
1. In "Absence Management" page
2. Find the absence you just created
3. Click "Edit" button
4. Change Status to "Approved"
5. Modify Notes if desired
6. Click "Update Absence"
7. View "Audit" button to see change history

Expected: Status changes to "APPROVED" with green badge

## Step 7: Test Reporting
1. Click "Reports & Analytics"
2. Select date range (include your test absence date)
3. Click "View Summary"

Expected: Report shows in table with your student and absence count

4. Click "Download CSV"

Expected: File downloads with name `attendance_report_YYYY-MM-DD_to_YYYY-MM-DD.csv`

5. Click "Download Audit Report"

Expected: File downloads with full change history showing who approved what and when

## Step 8: Test Future Absences
1. Click "Reports & Analytics"
2. Click "View Future Absences"

Expected: See list of all future scheduled absences

## Step 9: Test Presence Board
1. Click "Presence Board" or navigate to `/presence`
2. If current date has core hours:
   - Students with approved absences today show in green
   - Students with active check-ins show yellow bar
   - Students who checked out show teal bar
3. (Optional) Adjust timeline window: Admin Dashboard → Settings → Presence Timeline Start/End, then refresh Presence Board to see the new range

Expected: Students appear on timeline with appropriate colors and the timeline reflects the configured start/end hours (defaults 8–24)

## Step 10: Test Multiple Absences
1. Record absence for same student on different date
2. Record absence for different student
3. Generate report with date range covering both
4. Verify CSV and audit reports show both records

Expected: All absences appear with correct student names and statuses

## Common Test Scenarios

### Scenario 1: Pre-Approve Absence
- Record new absence with Status = "Approved"
- Notes are required
- Absence appears with green badge

### Scenario 2: Edit Existing Absence
- Create unapproved absence
- Edit to add more details in notes
- Edit to change to approved
- Audit log shows both changes

### Scenario 3: Multiple Seasons
- Create core hours for build season
- Create different core hours for offseason
- Switch between seasons
- Verify correct schedule shows for each

### Scenario 4: Report Filtering
- Create absences on dates in January
- Create absences on dates in February
- Generate report for January only
- Verify only January absences appear

## Verification Checklist

- [ ] Core hours tables created successfully
- [ ] Can view Core Hours Configuration page
- [ ] Can add core hours for multiple days
- [ ] Can edit core hours entries
- [ ] Can record absence with future date
- [ ] Can approve unapproved absence
- [ ] Can view audit trail
- [ ] Can download CSV report
- [ ] Can download audit report
- [ ] Can view future absences
- [ ] Presence board shows excused absences in green
- [ ] Presence board uses configured start/end hours (defaults 8–24)
- [ ] All API endpoints respond correctly

## If Something Doesn't Work

1. **Check database tables exist**:
   ```bash
   psql -U postgres -d robotics_attendance -c "\dt core_hours absences absence_logs"
   ```

2. **Check API is responding**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check browser console** for JavaScript errors
   - Press F12 in browser
   - Look at Console tab

4. **Check backend logs** for API errors
   - Look at terminal where backend is running

5. **Re-run database migration**:
   ```bash
   node backend/scripts/createAbsenceTables.js
   ```

## Sample Test Data SQL (Optional)

To create test data manually:

```sql
-- Add test core hours
INSERT INTO core_hours (id, day_of_week, start_time, end_time, type, season_type, is_active, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 1, '17:30', '20:00', 'required', 'build', true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 5, '15:30', '20:30', 'required', 'build', true, NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 6, '10:00', '16:00', 'required', 'build', true, NOW());

-- Add test absence (replace student_id with actual student)
INSERT INTO absences (id, student_id, absence_date, day_of_week, status, notes, approved_by, season_type, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', 'STUDENT_ID_HERE', '2026-01-13', 1, 'approved', 'Medical appointment', 'MENTOR_ID_HERE', 'build', NOW(), NOW());
```

Replace `STUDENT_ID_HERE` and `MENTOR_ID_HERE` with actual UUIDs from your database.

## Next Steps

After successful testing:
1. Update documentation with any implementation-specific details
2. Train coaches/mentors on the new system
3. Schedule soft launch with limited users
4. Monitor error logs and user feedback
5. Plan additional features based on feedback
