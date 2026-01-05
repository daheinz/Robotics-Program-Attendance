# Bulk Import Tool - User Guide

This tool allows you to bulk import users and their parent/guardian contact information from a CSV file into the robotics attendance system database.

## Prerequisites

- Node.js installed
- Database credentials configured in `backend/.env`
- CSV file formatted according to the specifications below

## Installation

Install required dependencies (if not already installed):

```bash
cd backend
npm install
```

The script uses `csv-parse`, `bcryptjs`, `uuid`, and `pg` packages.

## Usage

### Basic Usage

```bash
cd backend/scripts
node bulk_import.js <csv_file_path>
```

### Dry Run (Validate Only)

Test your CSV file without making any database changes:

```bash
node bulk_import.js <csv_file_path> --dry-run
```

This will validate the data and show what would be imported without actually committing changes to the database.

### Help

```bash
node bulk_import.js --help
```

## CSV File Format

### Required Columns

The CSV file **must** include these columns with exact header names:

- `alias` - Unique username for login (required)
- `first_name` - User's first name (required)
- `last_name` - User's last name (required)
- `role` - Must be one of: `student`, `mentor`, or `coach` (required)
- `pin` - 4-digit PIN for login (required for new users, optional for updates)

### Optional Columns

- `middle_name` - User's middle name
- `parent_name` - Parent/guardian full name
- `parent_phone` - Parent/guardian phone number
- `parent_relationship` - Relationship to student (e.g., Mother, Father, Guardian)

**Note:** To add parent/guardian contacts, you must provide both `parent_name` AND `parent_phone`. If either is missing, the contact will be skipped.

### Example CSV

```csv
alias,first_name,middle_name,last_name,role,pin,parent_name,parent_phone,parent_relationship
alice,Alice,,Anderson,student,1234,Carol Anderson,555-111-2222,Mother
bob,Bob,B.,Brown,student,4321,Daniel Brown,555-333-4444,Father
charlie,Charlie,,Chen,student,5678,Emma Chen,555-555-6666,Guardian
mentor_jane,Jane,,Doe,mentor,9999,,,
coach_kim,Kim,,Nguyen,coach,0000,,,
```

See `sample_users.csv` for a working example.

## How It Works

### Upsert Logic

The script uses "upsert" logic (update or insert):

**For Users:**
- If a user with the same `alias` already exists:
  - Updates their name, middle name, role
  - Reactivates them if they were previously soft-deleted
  - Updates PIN only if a new PIN is provided
- If the user doesn't exist:
  - Creates a new user with all provided information
  - PIN is required for new users

**For Parent Contacts:**
- Matched by combination of `user_id` + `phone_number`
- If contact exists: Updates name and relationship
- If contact doesn't exist: Creates new contact
- Contacts are skipped if `parent_name` or `parent_phone` is empty

### Validation

The script validates:
- All required fields are present and not empty
- Role is one of the valid values (student, mentor, coach)
- PIN is provided for new users
- Phone number exists if parent name is provided

## Output

After running, you'll see a summary like:

```
Import summary:
  users_inserted: 4
  users_updated: 0
  contacts_inserted: 2
  contacts_updated: 0
  contacts_skipped: 2
  rows_processed: 4
  rows_failed: 0
```

**Explanation:**
- `users_inserted` - Number of new users created
- `users_updated` - Number of existing users updated
- `contacts_inserted` - Number of new parent contacts created
- `contacts_updated` - Number of existing parent contacts updated
- `contacts_skipped` - Number of rows where parent contact info was incomplete
- `rows_processed` - Total rows successfully processed
- `rows_failed` - Number of rows that failed validation

## Error Handling

If a row fails validation, the script will:
- Display an error message with the row number and reason
- Continue processing remaining rows
- All successful changes are still committed (unless using `--dry-run`)

Example error:
```
Row 3 failed: Missing required field: pin
```

## Common Use Cases

### 1. Initial Student Import

```bash
# Validate first
node bulk_import.js students_2024.csv --dry-run

# Import if validation passes
node bulk_import.js students_2024.csv
```

### 2. Update Existing Users

Create a CSV with just the users you want to update. Leave `pin` empty to keep existing PIN:

```csv
alias,first_name,middle_name,last_name,role,pin
alice,Alice,Marie,Anderson-Smith,student,
```

This updates Alice's middle name and last name without changing her PIN.

### 3. Add Mentors/Coaches

```csv
alias,first_name,middle_name,last_name,role,pin
mentor_sarah,Sarah,,Johnson,mentor,8888
coach_mike,Mike,T.,Williams,coach,7777
```

### 4. Update Parent Contact Information

```csv
alias,first_name,last_name,role,pin,parent_name,parent_phone,parent_relationship
bob,Bob,Brown,student,,Robert Brown Sr.,555-999-8888,Father
```

This updates Bob's parent contact. The user fields prevent creation of duplicates.

## Tips

1. **Always use `--dry-run` first** to validate your CSV before importing
2. Keep your CSV files for future reference or re-import needs
3. Use Excel or Google Sheets to create/edit CSVs, but save as CSV format
4. Ensure phone numbers are consistent format for matching existing contacts
5. Back up your database before large imports

## Troubleshooting

### "Cannot find module" error
Make sure you're running from the `backend/scripts` directory or use full path.

### "client password must be a string" error
Check that your `backend/.env` file has `DB_PASSWORD` set correctly.

### "File not found" error
Verify the CSV file path is correct. Use absolute path if needed:
```bash
node bulk_import.js C:\path\to\your\file.csv
```

### Validation errors
Review the error message to see which field is missing or invalid. Common issues:
- Missing required columns in CSV header
- Invalid role value (must be exactly: student, mentor, or coach)
- Empty required fields

## Security Notes

- PINs are hashed using bcrypt before storage
- Never commit CSV files with real PINs to version control
- Consider adding `*.csv` to `.gitignore` if files contain sensitive data
- The sample file (`sample_users.csv`) uses dummy data for demonstration only
