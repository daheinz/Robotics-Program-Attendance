const db = require('../config/database');

async function addDurationTrigger() {
  try {
    console.log('Adding duration_minutes trigger to attendance_sessions...');

    await db.query(`
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

    await db.query(`
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

    await db.query(`
      UPDATE attendance_sessions
      SET duration_minutes = GREATEST(0, ROUND(EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 60.0))
      WHERE check_in_time IS NOT NULL
        AND check_out_time IS NOT NULL
        AND duration_minutes IS NULL;
    `);

    console.log('✓ Duration trigger added and missing durations backfilled');
    process.exit(0);
  } catch (error) {
    console.error('Error adding duration trigger:', error);
    process.exit(1);
  }
}

addDurationTrigger();
