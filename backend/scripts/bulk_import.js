const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/database');

const REQUIRED_USER_FIELDS = ['alias', 'first_name', 'last_name', 'role', 'pin'];
const VALID_ROLES = new Set(['student', 'mentor', 'coach']);

function validateRow(row) {
  for (const field of REQUIRED_USER_FIELDS) {
    if (!row[field] || !row[field].trim()) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  const role = (row.role || '').toLowerCase();
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Invalid role '${role}'. Must be one of: ${Array.from(VALID_ROLES).sort().join(', ')}`);
  }
}

async function upsertUser(client, row) {
  const alias = row.alias.trim();
  validateRow(row);

  // Check if user exists
  const existingResult = await client.query(
    'SELECT id FROM users WHERE alias = $1',
    [alias]
  );
  const existing = existingResult.rows[0];

  const pinHash = row.pin ? await bcrypt.hash(row.pin.trim(), 10) : null;
  const userId = existing ? existing.id : uuidv4();

  if (existing) {
    // Update existing user
    await client.query(
      `UPDATE users
       SET first_name = $1,
           middle_name = $2,
           last_name = $3,
           role = $4,
           is_active = true,
           updated_at = CURRENT_TIMESTAMP,
           pin_hash = COALESCE($5, pin_hash)
       WHERE id = $6`,
      [
        row.first_name,
        row.middle_name || null,
        row.last_name,
        row.role.toLowerCase(),
        pinHash,
        userId
      ]
    );
    return { userId, status: 'updated' };
  } else {
    // Insert new user
    if (!pinHash) {
      throw new Error('Pin is required for new users');
    }
    await client.query(
      `INSERT INTO users (id, first_name, middle_name, last_name, alias, role, pin_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [
        userId,
        row.first_name,
        row.middle_name || null,
        row.last_name,
        alias,
        row.role.toLowerCase(),
        pinHash
      ]
    );
    return { userId, status: 'inserted' };
  }
}

async function upsertParentContact(client, userId, row) {
  const name = (row.parent_name || '').trim();
  const phone = (row.parent_phone || '').trim();
  const relationship = (row.parent_relationship || '').trim() || null;

  if (!name || !phone) {
    return { contactId: null, status: 'skipped' };
  }

  // Check if contact exists for this user with this phone
  const existingResult = await client.query(
    'SELECT id FROM parent_contacts WHERE user_id = $1 AND phone_number = $2',
    [userId, phone]
  );
  const existing = existingResult.rows[0];

  if (existing) {
    // Update existing contact
    await client.query(
      `UPDATE parent_contacts
       SET name = $1,
           relationship = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [name, relationship, existing.id]
    );
    return { contactId: existing.id, status: 'updated' };
  } else {
    // Insert new contact
    const contactId = uuidv4();
    await client.query(
      `INSERT INTO parent_contacts (id, user_id, name, phone_number, relationship)
       VALUES ($1, $2, $3, $4, $5)`,
      [contactId, userId, name, phone, relationship]
    );
    return { contactId, status: 'inserted' };
  }
}

async function processCSV(csvPath, dryRun = false) {
  const client = await pool.connect();
  const summary = {
    users_inserted: 0,
    users_updated: 0,
    contacts_inserted: 0,
    contacts_updated: 0,
    contacts_skipped: 0,
    rows_processed: 0,
    rows_failed: 0
  };

  try {
    // Read and parse CSV file
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    await client.query('BEGIN');

    for (let idx = 0; idx < records.length; idx++) {
      const row = records[idx];
      try {
        // Upsert user
        const { userId, status: userStatus } = await upsertUser(client, row);
        summary[`users_${userStatus}`]++;

        // Upsert parent contact
        const { status: contactStatus } = await upsertParentContact(client, userId, row);
        summary[`contacts_${contactStatus}`]++;

        summary.rows_processed++;
      } catch (error) {
        summary.rows_failed++;
        console.error(`Row ${idx + 1} failed: ${error.message}`);
      }
    }

    if (dryRun) {
      await client.query('ROLLBACK');
      console.log('\nDry run complete; no changes committed.');
    } else {
      await client.query('COMMIT');
      console.log('\nImport committed to database.');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing CSV:', error);
    throw error;
  } finally {
    client.release();
  }

  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node bulk_import.js <csv_path> [--dry-run]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run    Validate without committing changes');
    process.exit(args.length === 0 ? 1 : 0);
  }

  const csvPath = args[0];
  const dryRun = args.includes('--dry-run');

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File not found: ${csvPath}`);
    process.exit(1);
  }

  try {
    const summary = await processCSV(csvPath, dryRun);
    
    console.log('\nImport summary:');
    for (const [key, value] of Object.entries(summary)) {
      console.log(`  ${key}: ${value}`);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processCSV };
