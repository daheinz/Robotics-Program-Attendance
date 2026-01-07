# Absence Management System - Configuration Examples

## Core Hours Configuration Examples

### Build Season - Standard FRC Schedule

**Monday**
- Start: 17:30 (5:30 PM)
- End: 20:00 (8:00 PM)
- Duration: 2.5 hours
- Type: Required

**Friday**
- Start: 15:30 (3:30 PM)
- End: 20:30 (8:30 PM)
- Duration: 5 hours
- Type: Required

**Saturday**
- Start: 10:00 (10:00 AM)
- End: 16:00 (4:00 PM)
- Duration: 6 hours
- Type: Required

**Total Weekly Commitment**: 13.5 hours required

### Off-Season - Maintenance & Meetings

**Wednesday**
- Start: 18:00 (6:00 PM)
- End: 19:30 (7:30 PM)
- Duration: 1.5 hours
- Type: Suggested

**Saturday**
- Start: 10:00 (10:00 AM)
- End: 12:00 (12:00 PM)
- Duration: 2 hours
- Type: Required

**Total Weekly Commitment**: 2 hours required, 1.5 hours suggested

---

## Absence Recording Examples

### Example 1: Medical Appointment

```
Student: John Smith (alias: jsmith)
Date: 2026-01-24 (Friday)
Day of Week: Friday
Status: Approved
Notes: "Medical appointment with orthodontist - scheduled 3:00 PM - 4:30 PM. 
Will miss Friday session. Pre-approved by parents."
Approved By: Coach Mike (automatically recorded)
```

### Example 2: School Event

```
Student: Maria Garcia (alias: mgarcia)
Date: 2026-01-27 (Monday)
Day of Week: Monday
Status: Approved
Notes: "Science bowl competition at school - team member. 
Must leave at 4:00 PM. Will miss Monday core hours."
Approved By: Mentor Sarah (automatically recorded)
```

### Example 3: Unapproved - Under Review

```
Student: Alex Johnson (alias: ajohnson)
Date: 2026-02-01 (Saturday)
Day of Week: Saturday
Status: Unapproved
Notes: "Student reported sick Saturday morning. 
Awaiting confirmation - possible rescheduling."
Approved By: (None yet)
```

### Example 4: Unapproved Changed to Approved

```
Initial Recording:
Status: Unapproved
Notes: "Student indicated family emergency"

Edit Update:
Status: Approved (after mentor verification)
Notes: "Confirmed family emergency with parent. 
Student helping with immediate family matter. Excused."
Updated By: Coach Mike (automatically recorded)

Audit Log Shows:
1. Created by Coach Mike - status: unapproved, notes: "family emergency"
2. Updated by Coach Mike - status: unapproved → approved, 
   notes: "family emergency" → "Confirmed family emergency..."
```

---

## Report Examples

### Report 1: Weekly Attendance Summary

**Report Period**: January 13-19, 2026
**Season Type**: Build Season

| Student Name | Alias | Approved Absences | Unapproved Absences | Total |
|---|---|---|---|---|
| John Smith | jsmith | 1 | 0 | 1 |
| Maria Garcia | mgarcia | 0 | 0 | 0 |
| Alex Johnson | ajohnson | 0 | 1 | 1 |
| ... | ... | ... | ... | ... |

**CSV Format**: `attendance_report_2026-01-13_to_2026-01-19.csv`

### Report 2: Detailed Audit Report (Sample)

```
=== ABSENCE AUDIT REPORT ===
Report Period: 2026-01-13 to 2026-01-19
Generated: January 24, 2026 at 2:45 PM

================================================================================

Student: John Smith (jsmith)
Date: 2026-01-17
Status: APPROVED
Notes: Medical appointment with orthodontist - scheduled 3:00 PM - 4:30 PM
Approved By: Coach Mike

Audit Log:
────────────────────────────────────────────────────────────────
  [1] CREATED by coach_mike on 2026-01-13 at 10:15 AM
      status: unapproved
      notes: Medical appointment with orthodontist - scheduled 3:00 PM - 4:30 PM

  [2] UPDATED by coach_mike on 2026-01-14 at 3:30 PM
      status: unapproved → approved
      notes: [unchanged]

────────────────────────────────────────────────────────────────

Student: Maria Garcia (mgarcia)
Date: 2026-01-18
Status: APPROVED
Notes: Science bowl competition at school - team member. Must leave at 4:00 PM
Approved By: Mentor Sarah

Audit Log:
────────────────────────────────────────────────────────────────
  [1] CREATED by mentor_sarah on 2026-01-17 at 4:45 PM
      status: approved
      notes: Science bowl competition at school - team member

────────────────────────────────────────────────────────────────

(Additional records...)
```

**Text Format**: `audit_report_2026-01-13_to_2026-01-19.txt`

### Report 3: Future Absences

```
Generated: January 24, 2026 at 2:45 PM

John Smith (jsmith)
├── 2026-02-07 (Saturday) - APPROVED
│   Medical follow-up appointment
└── 2026-02-14 (Saturday) - PENDING
    Waiting for confirmation from parents

Maria Garcia (mgarcia)
└── 2026-02-21 (Saturday) - PENDING
    Under review

Alex Johnson (ajohnson)
├── 2026-01-31 (Friday) - APPROVED
│   College campus visit
└── 2026-02-07 (Saturday) - APPROVED
    College campus visit (continuation)
```

---

## Compliance Rules Examples

### Example 1: Compliant Attendance

**Student**: John Smith
**Core Hours**: Monday 5:30 PM - 8:00 PM (2.5 hours required)
**Check-in/out Records**:
- Check in: 5:35 PM (5 minutes late - within 30-min grace)
- Check out: 8:00 PM (on time)
- **Time Present**: 2 hours 25 minutes
- **Required**: 2 hours 30 minutes minus 30 minutes grace = 2 hours
- **Result**: ✅ COMPLIANT (2:25 > 2:00)

### Example 2: Compliant with Lunch Break

**Student**: Maria Garcia
**Core Hours**: Saturday 10:00 AM - 4:00 PM (6 hours required)
**Check-in/out Records**:
- Check in: 10:00 AM
- Check out: 12:30 PM (lunch)
- Check in: 1:00 PM
- Check out: 4:00 PM
- **Time Present**: 2:30 + 3:00 = 5.5 hours
- **Required**: 6 hours minus 30 minutes grace = 5.5 hours
- **Result**: ✅ COMPLIANT (5:30 = 5:30)

### Example 3: Compliant with Override

**Student**: Alex Johnson
**Core Hours**: Friday 3:30 PM - 8:30 PM (5 hours required)
**Check-in/out Records**:
- Check in: 4:15 PM (45 minutes late)
- Check out: 8:15 PM (15 minutes early)
- **Time Present**: 3 hours 60 minutes
- **Required**: 5 hours minus 30 minutes grace = 4.5 hours
- **Automatic Result**: ❌ UNAPPROVED (4:00 < 4:30)
- **Mentor Override**: ✅ APPROVED with notes "Student had transportation issue, made excellent contributions while present."

### Example 4: Unapproved - Multiple Issues

**Student**: Blake Wilson
**Core Hours**: Monday 5:30 PM - 8:00 PM (2.5 hours required)
**Check-in/out Records**:
- Check in: 6:30 PM (1 hour late)
- Check out: 7:45 PM (15 minutes early)
- **Time Present**: 1 hour 15 minutes
- **Required**: 2 hours 30 minutes minus 30 minutes grace = 2 hours
- **Automatic Result**: ❌ UNAPPROVED (1:15 < 2:00)
- **Mentor Action**: Attempted override rejected - too many issues compounded
- **Final Status**: UNAPPROVED with notes "Multiple attendance issues - counseling recommended"

---

## API Request/Response Examples

### Creating Core Hours

**Request:**
```json
POST /api/core-hours
{
  "dayOfWeek": 1,
  "startTime": "17:30",
  "endTime": "20:00",
  "type": "required",
  "seasonType": "build"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "day_of_week": 1,
  "start_time": "17:30:00",
  "end_time": "20:00:00",
  "type": "required",
  "season_type": "build",
  "is_active": true,
  "created_at": "2026-01-13T10:15:00.000Z",
  "updated_at": "2026-01-13T10:15:00.000Z"
}
```

### Creating Absence

**Request:**
```json
POST /api/absences
{
  "studentId": "550e8400-e29b-41d4-a716-446655440002",
  "absenceDate": "2026-01-17",
  "dayOfWeek": 5,
  "status": "unapproved",
  "notes": "Medical appointment with orthodontist",
  "seasonType": "build"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "student_id": "550e8400-e29b-41d4-a716-446655440002",
  "absence_date": "2026-01-17",
  "day_of_week": 5,
  "status": "unapproved",
  "notes": "Medical appointment with orthodontist",
  "approved_by": null,
  "season_type": "build",
  "created_at": "2026-01-13T10:15:00.000Z",
  "updated_at": "2026-01-13T10:15:00.000Z"
}
```

### Approving Absence

**Request:**
```json
PUT /api/absences/550e8400-e29b-41d4-a716-446655440010
{
  "status": "approved",
  "notes": "Medical appointment with orthodontist - confirmed with parent",
  "approvedBy": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "student_id": "550e8400-e29b-41d4-a716-446655440002",
  "absence_date": "2026-01-17",
  "day_of_week": 5,
  "status": "approved",
  "notes": "Medical appointment with orthodontist - confirmed with parent",
  "approved_by": "550e8400-e29b-41d4-a716-446655440003",
  "season_type": "build",
  "created_at": "2026-01-13T10:15:00.000Z",
  "updated_at": "2026-01-14T15:30:00.000Z"
}
```

### Getting Audit Log

**Request:**
```
GET /api/absences/550e8400-e29b-41d4-a716-446655440010/audit-log
```

**Response:**
```json
{
  "absenceId": "550e8400-e29b-41d4-a716-446655440010",
  "logs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "absence_id": "550e8400-e29b-41d4-a716-446655440010",
      "action": "created",
      "user_id": "550e8400-e29b-41d4-a716-446655440003",
      "user_alias": "coach_mike",
      "first_name": "Mike",
      "last_name": "Johnson",
      "changes": {
        "status": "unapproved",
        "notes": "Medical appointment with orthodontist"
      },
      "created_at": "2026-01-13T10:15:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440012",
      "absence_id": "550e8400-e29b-41d4-a716-446655440010",
      "action": "updated",
      "user_id": "550e8400-e29b-41d4-a716-446655440003",
      "user_alias": "coach_mike",
      "first_name": "Mike",
      "last_name": "Johnson",
      "changes": {
        "status": {
          "from": "unapproved",
          "to": "approved"
        },
        "notes": {
          "from": "Medical appointment with orthodontist",
          "to": "Medical appointment with orthodontist - confirmed with parent"
        }
      },
      "created_at": "2026-01-14T15:30:00.000Z"
    }
  ]
}
```

---

## Day of Week Reference

Used in core hours and absence records:

```
0 = Sunday
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
```

---

## Time Format

All times use **24-hour format** (HH:MM):

```
00:00 = Midnight
10:30 = 10:30 AM
17:30 = 5:30 PM
23:59 = 11:59 PM
```

---

## Season Types

```
"build"      = Build season (competitive preparation)
"offseason"  = Off-season (maintenance, meetings)
```

---

## Status Values

```
"approved"     = Absence has been approved by mentor/coach
"unapproved"   = Absence recorded but not yet approved
```

---

## Timestamps

All timestamps in **ISO 8601 format** (UTC):

```
2026-01-17T15:30:00.000Z
```

---

## CSV Export Format

```
Student Name,Date,Status
"John Smith",2026-01-17,"Approved Absent"
"Maria Garcia",2026-01-18,"Approved Absent"
"Alex Johnson",2026-01-24,"Unapproved Absent"
```

---

This configuration guide provides examples for all key scenarios in the Absence Management System.
