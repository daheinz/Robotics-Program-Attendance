const db = require('../config/database');

async function createAbsenceTables() {
  try {
    console.log('Creating core_hours table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS core_hours (
        id UUID PRIMARY KEY,
        day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'required' CHECK (type IN ('required', 'suggested')),
        season_type VARCHAR(50) NOT NULL DEFAULT 'build' CHECK (season_type IN ('build', 'offseason')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ core_hours table created');

    console.log('Creating absences table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS absences (
        id UUID PRIMARY KEY,
        student_id UUID NOT NULL REFERENCES users(id),
        absence_date DATE NOT NULL,
        day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        status VARCHAR(50) NOT NULL DEFAULT 'unapproved' CHECK (status IN ('approved', 'unapproved')),
        notes TEXT,
        approved_by UUID REFERENCES users(id),
        season_type VARCHAR(50) NOT NULL DEFAULT 'build' CHECK (season_type IN ('build', 'offseason')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, absence_date, season_type)
      )
    `);
    console.log('✓ absences table created');

    console.log('Creating absence_logs table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS absence_logs (
        id UUID PRIMARY KEY,
        absence_id UUID NOT NULL REFERENCES absences(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated')),
        user_id UUID NOT NULL REFERENCES users(id),
        changes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ absence_logs table created');

    console.log('Creating indexes...');
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_absences_student_id ON absences(student_id);
      CREATE INDEX IF NOT EXISTS idx_absences_absence_date ON absences(absence_date);
      CREATE INDEX IF NOT EXISTS idx_absences_status ON absences(status);
      CREATE INDEX IF NOT EXISTS idx_absence_logs_absence_id ON absence_logs(absence_id);
      CREATE INDEX IF NOT EXISTS idx_core_hours_day_season ON core_hours(day_of_week, season_type);
    `);
    console.log('✓ Indexes created');

    console.log('✓ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createAbsenceTables();
