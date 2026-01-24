const db = require('../config/database');

async function addSlideshowSettings() {
  try {
    console.log('Adding slideshow settings columns to system_settings...');

    await db.query(`
      ALTER TABLE system_settings
      ADD COLUMN IF NOT EXISTS slideshow_interval_seconds INT,
      ADD COLUMN IF NOT EXISTS slideshow_presence_every_n INT,
      ADD COLUMN IF NOT EXISTS slideshow_presence_duration_seconds INT;
    `);

    await db.query(`
      UPDATE system_settings
      SET slideshow_interval_seconds = COALESCE(slideshow_interval_seconds, 10),
          slideshow_presence_every_n = COALESCE(slideshow_presence_every_n, 2),
          slideshow_presence_duration_seconds = COALESCE(slideshow_presence_duration_seconds, 30);
    `);

    await db.query(`
      ALTER TABLE system_settings
      ALTER COLUMN slideshow_interval_seconds SET DEFAULT 10,
      ALTER COLUMN slideshow_interval_seconds SET NOT NULL,
      ALTER COLUMN slideshow_presence_every_n SET DEFAULT 2,
      ALTER COLUMN slideshow_presence_every_n SET NOT NULL,
      ALTER COLUMN slideshow_presence_duration_seconds SET DEFAULT 30,
      ALTER COLUMN slideshow_presence_duration_seconds SET NOT NULL;
    `);

    console.log('✓ Slideshow settings columns added/verified successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding slideshow settings columns:', error);
    process.exit(1);
  }
}

addSlideshowSettings();
