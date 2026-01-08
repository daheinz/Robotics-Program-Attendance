const db = require('../config/database');

async function addPresenceHours() {
  try {
    console.log('Adding presence window columns to system_settings...');

    // Add columns if they do not exist
    await db.query(`
      ALTER TABLE system_settings 
      ADD COLUMN IF NOT EXISTS presence_start_hour INT,
      ADD COLUMN IF NOT EXISTS presence_end_hour INT;
    `);

    // Backfill null values with defaults
    await db.query(`
      UPDATE system_settings 
      SET presence_start_hour = COALESCE(presence_start_hour, 8),
          presence_end_hour = COALESCE(presence_end_hour, 24);
    `);

    // Enforce defaults and non-null
    await db.query(`
      ALTER TABLE system_settings 
      ALTER COLUMN presence_start_hour SET DEFAULT 8,
      ALTER COLUMN presence_start_hour SET NOT NULL,
      ALTER COLUMN presence_end_hour SET DEFAULT 24,
      ALTER COLUMN presence_end_hour SET NOT NULL;
    `);

    // Add per-column constraints if missing
    const constraints = await db.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'system_settings' AND constraint_type = 'CHECK';
    `);
    const existing = constraints.rows.map(r => r.constraint_name);

    if (!existing.includes('system_settings_presence_start_hour_ck')) {
      await db.query(`
        ALTER TABLE system_settings 
        ADD CONSTRAINT system_settings_presence_start_hour_ck 
        CHECK (presence_start_hour >= 0 AND presence_start_hour <= 23);
      `);
    }

    if (!existing.includes('system_settings_presence_end_hour_ck')) {
      await db.query(`
        ALTER TABLE system_settings 
        ADD CONSTRAINT system_settings_presence_end_hour_ck 
        CHECK (presence_end_hour > 0 AND presence_end_hour <= 24);
      `);
    }

    if (!existing.includes('system_settings_presence_window_ck')) {
      await db.query(`
        ALTER TABLE system_settings 
        ADD CONSTRAINT system_settings_presence_window_ck 
        CHECK (presence_start_hour < presence_end_hour);
      `);
    }

    console.log('✓ Presence window columns added/verified successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding presence window columns:', error);
    process.exit(1);
  }
}

addPresenceHours();
