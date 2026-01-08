# Coach & Mentor User Guide

**Daily System Usage for Mentors and Coaches**

This guide covers how to use the Robotics Attendance System day-to-day as a mentor or coach.

---

## Table of Contents
- [Quick Start](#quick-start)
- [Daily Tasks](#daily-tasks)
- [Weekly Tasks](#weekly-tasks)
- [Seasonal Tasks](#seasonal-tasks)
- [Feature Reference](#feature-reference)

---

## Quick Start

### Accessing the System

1. **Open browser** → Navigate to system URL (e.g., `http://localhost:5173` or your team's server)
2. **Click your name** from the user list
3. **Enter your PIN** (4-6 digits)
4. **Click "Login"**

**Expected**: You'll see the Admin Dashboard with navigation options

---

## Daily Tasks

### 1. Check Who's Present (Most Common)

**Purpose**: See who's currently on-site in real-time

**Steps**:
1. From dashboard, click **"Presence Board"**
2. View the timeline showing:
   - **Yellow bars** = Students currently on-site
   - **Teal bars** = Students who checked out earlier
   - **Green section** = Students with approved absences
   - **Red line** = Current time

**Tips**:
- Page auto-refreshes every 30 seconds
- Click "Return to Kiosk" to get back to check-in screen
- Shaded regions show required practice times (if configured)

### 2. Record a Student Absence

**When**: Student tells you they can't attend (illness, family emergency, school event, etc.)

**Steps**:
1. Navigate to **"Absence Management"**
2. Click **"Record New Absence"** button
3. Fill in the form:
   - **Student**: Select from dropdown
   - **Date**: Choose the date they'll be absent
   - **Notes**: Enter the reason (e.g., "Family emergency", "School band concert")
   - **Status**: Choose "Approved" if you're approving it now, or "Unapproved" if you want another coach to review
4. Click **"Save"**

**Expected**: Absence appears in the list with a green badge (approved) or orange badge (unapproved)

**Important Notes**:
- Notes are required - always document why
- Notes are only visible to mentors/coaches (students can't see them)
- You can record absences in advance (future dates)

### 3. Approve Pending Absences

**When**: Another coach recorded an unapproved absence and you need to review it

**Steps**:
1. Navigate to **"Absence Management"**
2. Check the **"Unapproved Absences"** section at the top
3. Review the student, date, and notes
4. Click **"Edit"** button
5. Change Status to **"Approved"**
6. Add any additional notes if needed
7. Click **"Save Changes"**

**Expected**: Absence moves from orange badge to green badge

### 4. Help Students Check In/Out

**When**: Student can't find their name or forgot their PIN

**Steps for Check-In**:
1. Go to **Kiosk Page** (main check-in screen)
2. Find student's name and click it
3. Enter their PIN (ask them if you don't know it)
4. Click "Check In"

**Steps for Check-Out**:
1. Go to **Kiosk Page**
2. Find student's name and click it
3. Enter their PIN
4. They'll see reflection prompt - help them type their reflection
5. Click "Check Out"

**Troubleshooting**:
- If PIN is forgotten → Use Admin Dashboard → Users → Edit PIN
- If name is missing → Check if user account exists in Users tab

### 5. Verify Student Checked Out

**When**: Practice is ending and you need to ensure everyone checked out

**Steps**:
1. Go to **"Presence Board"**
2. Look for **yellow bars** (still on-site)
3. Help any students with yellow bars check out
4. Alternatively: Admin Dashboard → **"Users"** tab shows current check-in status

---

## Weekly Tasks

### 1. Review Attendance Reports

**Purpose**: See attendance trends, identify students with low hours

**Steps**:
1. Navigate to **"Reports & Analytics"**
2. Set date range:
   - **Start Date**: First day of week (e.g., Monday)
   - **End Date**: Last day of week (e.g., Saturday)
3. Click **"View Summary"**
4. Review the table showing:
   - Total sessions per student
   - Total hours attended
   - Days with absences (approved/unapproved)
   - Compliance percentage (if core hours configured)

**Actions**:
- Download CSV for spreadsheet analysis (click "Download CSV")
- Download full audit report to see edit history (click "Download Audit Report")
- Follow up with students showing low attendance

### 2. Check Future Scheduled Absences

**Purpose**: Plan for upcoming practices with known absences

**Steps**:
1. Navigate to **"Reports & Analytics"**
2. Click **"View Future Absences"** button
3. Review list of all scheduled future absences

**Use Cases**:
- Planning driver assignments
- Adjusting team task assignments
- Knowing who won't be at competition prep sessions

---

## Seasonal Tasks

### 1. Configure Core Hours (Start of Season)

**When**: Beginning of build season or off-season program

**Purpose**: Define when students are required/expected to attend

**Steps**:
1. Navigate to **"Core Hours Configuration"**
2. Select season type:
   - **Build Season**: Kickoff through competition
   - **Offseason**: Summer programs, training, outreach
3. Click **"Add New Core Hours"** for each meeting day
4. Fill in form:
   - **Day of Week**: Select day (Monday, Friday, Saturday, etc.)
   - **Start Time**: When practice starts (e.g., 5:30 PM)
   - **End Time**: When practice ends (e.g., 8:00 PM)
   - **Type**: 
     - **Required** = Students must attend
     - **Suggested** = Optional but encouraged
5. Click **"Save"**
6. Repeat for all practice days

**Example Build Season Schedule**:
- Monday: 5:30 PM - 8:00 PM (Required)
- Friday: 3:30 PM - 8:30 PM (Required)
- Saturday: 10:00 AM - 4:00 PM (Required)

**Expected**: Core hours appear in list and show as shaded regions on Presence Board

### 2. Edit/Delete Core Hours

**When**: Schedule changes (holidays, school conflicts, etc.)

**Steps**:
1. Navigate to **"Core Hours Configuration"**
2. Find the entry to modify
3. Click **"Edit"** to change times, or **"Delete"** to remove
4. Confirm changes

### 3. Switch Between Seasons

**When**: Transitioning from build season to off-season or vice versa

**Steps**:
1. Navigate to **"Core Hours Configuration"**
2. Click the **Season Type** toggle (Build/Offseason)
3. Configure different hours for the new season

**Note**: Both seasons keep their separate schedules - switching just shows different set

---

## Feature Reference

### Admin Dashboard Features

#### Users Tab
**Purpose**: Manage student, mentor, and coach accounts

**Actions**:
- View all users by role (filter dropdown)
- Add new user (button at top)
- Edit user details (name, alias, role)
- Change user PIN
- Deactivate user account

**Common Use**:
- Resetting forgotten PINs
- Adding new team members
- Updating nicknames/aliases

#### Attendance Records Tab
**Purpose**: View and correct attendance sessions

**Actions**:
- View all check-in/check-out records
- Filter by date range or student
- Edit incorrect check-in/check-out times (requires audit reason)
- Manually create session if student forgot to check in

**Common Use**:
- Fixing mistakes (student forgot to check out)
- Adding session for someone who attended but forgot to check in

#### Settings Tab
**Purpose**: Configure system-wide settings

**Available Settings**:
- **Reflection Prompt**: The question students answer at check-out
- **Presence Timeline Start Hour**: When timeline starts (default 8)
- **Presence Timeline End Hour**: When timeline ends (default 24)

**When to Change**:
- Reflection prompt: Change periodically to keep reflections meaningful
- Timeline hours: Adjust if your practices are outside 8am-midnight window

---

## Common Scenarios

### Scenario 1: Student Texts They'll Be Absent

**Situation**: Student texts "Can't come today, doctor appointment"

**Actions**:
1. Open Absence Management
2. Record New Absence
3. Select student and today's date
4. Notes: "Doctor appointment"
5. Status: Approved
6. Save

**Result**: Student shows as excused absence on Presence Board (green)

### Scenario 2: Student Forgot to Check Out Last Night

**Situation**: Attendance record shows student never checked out yesterday

**Actions**:
1. Go to Admin Dashboard → Attendance Records
2. Find their check-in session from yesterday
3. Click "Edit"
4. Enter check-out time (e.g., when practice ended)
5. Audit reason: "Student forgot to check out"
6. Save

**Result**: Session now complete with duration calculated

### Scenario 3: Generating Report for Meeting

**Situation**: Weekly team meeting and you need attendance stats

**Actions**:
1. Reports & Analytics
2. Set date range to this week
3. Click "View Summary"
4. Click "Download CSV"
5. Open CSV in Excel/Google Sheets
6. Create charts or summary for presentation

### Scenario 4: Student Lost Access to Name

**Situation**: Student can't find their name on check-in screen

**Possible Causes**:
- Account inactive
- Name/alias changed
- Account deleted

**Actions**:
1. Admin Dashboard → Users
2. Search for student
3. Check if account exists and is active
4. If inactive: Re-activate
5. If missing: Create new account
6. Give student their new PIN

### Scenario 5: Setting Up for New Season

**Situation**: Build season starting next week

**Actions**:
1. Core Hours Configuration
2. Switch to "Build Season" if not already selected
3. Delete old/outdated core hours
4. Add new schedule for this season
5. Verify on Presence Board that shaded regions appear correctly

---

## Best Practices

### Daily Routine
✅ Check Presence Board at start of practice  
✅ Record absences as soon as you hear about them  
✅ Verify all students checked out at end of practice  
✅ Help students who can't access check-in/out  

### Weekly Routine
✅ Review attendance report  
✅ Follow up with students with low attendance  
✅ Check future absences for planning  
✅ Verify no stuck sessions (forgot to check out)  

### Documentation
✅ Always add notes when recording absences  
✅ Use clear audit reasons when editing records  
✅ Document why when changing core hours  
✅ Keep reflection prompts relevant and rotating  

### Data Quality
✅ Correct mistakes promptly  
✅ Encourage students to check in/out themselves  
✅ Review weekly reports for anomalies  
✅ Update inactive accounts (graduated students)  

---

## Troubleshooting

### "Presence Board is empty"
**Cause**: No one has checked in today  
**Solution**: Normal if before practice hours

### "Student shows as absent but they're here"
**Cause**: They didn't check in yet, or absence was recorded by mistake  
**Solution**: 
1. Check if they checked in (Presence Board)
2. If not: Help them check in
3. If yes: Delete incorrect absence record

### "Timeline doesn't show our practice hours"
**Cause**: Core hours not configured, or wrong season selected  
**Solution**: 
1. Go to Core Hours Configuration
2. Verify correct season type selected
3. Add core hours if missing
4. Refresh Presence Board

### "Can't approve absence"
**Cause**: Only coaches can approve (if you're a mentor)  
**Solution**: Ask a coach to approve, or have your access level changed

### "Report shows incorrect hours"
**Cause**: Students forgot to check out, sessions incomplete  
**Solution**: 
1. Admin Dashboard → Attendance Records
2. Find incomplete sessions (missing check-out time)
3. Edit and add check-out times with audit reason

---

## Getting Help

**Documentation**:
- See `ABSENCE_MANAGEMENT_GUIDE.md` for detailed absence features
- See `QUICK_START_TESTING.md` for testing procedures
- See `TECHNICAL_ARCHITECTURE.md` for system design

**Common Issues**:
- Check browser console (F12) for errors
- Verify backend/frontend are running
- Restart services if unresponsive

---

**Guide last updated**: January 8, 2026  
**System version**: 2.0 with Absence Management  
**Target audience**: Coaches and Mentors
