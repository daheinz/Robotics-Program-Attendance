const { pool } = require('../config/database');
require('dotenv').config();

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database initialization...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        last_name VARCHAR(255) NOT NULL,
        alias VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'mentor', 'coach')),
        pin_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created users table');

    // Create parent_contacts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS parent_contacts (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        relationship VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created parent_contacts table');

    // Create attendance_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        check_in_time TIMESTAMP NOT NULL,
        check_out_time TIMESTAMP,
        duration_minutes INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created attendance_sessions table');

    // Create duration trigger to ensure duration_minutes is calculated
    await client.query(`
      CREATE OR REPLACE FUNCTION set_duration_minutes()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
          NEW.duration_minutes := GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60.0));
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'set_duration_minutes_trigger'
        ) THEN
          CREATE TRIGGER set_duration_minutes_trigger
          BEFORE INSERT OR UPDATE ON attendance_sessions
          FOR EACH ROW
          EXECUTE FUNCTION set_duration_minutes();
        END IF;
      END $$;
    `);

    // Create reflections table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reflections (
        id UUID PRIMARY KEY,
        attendance_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created reflections table');

    // Create system_settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id UUID PRIMARY KEY,
        reflection_prompt TEXT NOT NULL,
        presence_start_hour INT NOT NULL DEFAULT 8 CHECK (presence_start_hour >= 0 AND presence_start_hour <= 23),
        presence_end_hour INT NOT NULL DEFAULT 24 CHECK (presence_end_hour > 0 AND presence_end_hour <= 24),
        slideshow_interval_seconds INT NOT NULL DEFAULT 10,
        slideshow_presence_every_n INT NOT NULL DEFAULT 2,
        slideshow_presence_duration_seconds INT NOT NULL DEFAULT 30,
        CHECK (presence_start_hour < presence_end_hour),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created system_settings table');

    // Create audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY,
        actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(100) NOT NULL,
        target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Created audit_log table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_alias ON users(alias);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_parent_contacts_user_id ON parent_contacts(user_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_sessions_user_id ON attendance_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_sessions_check_in ON attendance_sessions(check_in_time);
      CREATE INDEX IF NOT EXISTS idx_reflections_user_id ON reflections(user_id);
      CREATE INDEX IF NOT EXISTS idx_reflections_attendance_id ON reflections(attendance_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_user_id);
    `);
    console.log('✓ Created indexes');

    // Insert default system settings if none exist
    const settingsCheck = await client.query('SELECT COUNT(*) FROM system_settings');
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      const { v4: uuidv4 } = require('uuid');
      await client.query(`
        INSERT INTO system_settings (
          id, reflection_prompt, presence_start_hour, presence_end_hour,
          slideshow_interval_seconds, slideshow_presence_every_n, slideshow_presence_duration_seconds
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [uuidv4(), 'Please reflect on what you learned or accomplished today.', 8, 24, 10, 2, 30]);
      console.log('✓ Inserted default system settings');
    }

    console.log('\n✅ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = initDatabase;
