const db = require('../config/database');

async function addPresenceColors() {
  try {
    console.log('Adding presence board color columns to system_settings...');
    
    // Add color columns with default values
    await db.query(`
      ALTER TABLE system_settings
      ADD COLUMN IF NOT EXISTS color_student_checked_in VARCHAR(7) DEFAULT '#48bb78',
      ADD COLUMN IF NOT EXISTS color_mentor_checked_in VARCHAR(7) DEFAULT '#4299e1',
      ADD COLUMN IF NOT EXISTS color_not_checked_in VARCHAR(7) DEFAULT '#a0aec0',
      ADD COLUMN IF NOT EXISTS color_past_session VARCHAR(7) DEFAULT '#4fd1c5',
      ADD COLUMN IF NOT EXISTS color_active_session VARCHAR(7) DEFAULT '#f6e05e',
      ADD COLUMN IF NOT EXISTS color_current_time VARCHAR(7) DEFAULT '#ff6b6b'
    `);
    
    // Backfill defaults for existing rows
    await db.query(`
      UPDATE system_settings
      SET 
        color_student_checked_in = COALESCE(color_student_checked_in, '#48bb78'),
        color_mentor_checked_in = COALESCE(color_mentor_checked_in, '#4299e1'),
        color_not_checked_in = COALESCE(color_not_checked_in, '#a0aec0'),
        color_past_session = COALESCE(color_past_session, '#4fd1c5'),
        color_active_session = COALESCE(color_active_session, '#f6e05e'),
        color_current_time = COALESCE(color_current_time, '#ff6b6b')
      WHERE color_student_checked_in IS NULL
    `);
    
    console.log('✓ Presence board color columns added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding presence color columns:', error);
    process.exit(1);
  }
}

addPresenceColors();
