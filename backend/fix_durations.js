const db = require('./config/database');

async function fixDurations() {
  try {
    console.log('Updating duration_minutes for all sessions with check_out_time...');
    
    const result = await db.query(`
      UPDATE attendance_sessions
      SET duration_minutes = EXTRACT(EPOCH FROM (check_out_time - check_in_time))::numeric / 60
      WHERE check_out_time IS NOT NULL AND duration_minutes IS NULL
      RETURNING id, duration_minutes
    `);
    
    console.log(`Updated ${result.rows.length} sessions with duration data`);
    
    // Show summary
    const summary = await db.query(`
      SELECT 
        u.alias,
        COUNT(*) as all_sessions,
        COUNT(CASE WHEN a.check_out_time IS NOT NULL THEN 1 END) as completed_sessions,
        SUM(CASE WHEN a.check_out_time IS NOT NULL THEN a.duration_minutes ELSE 0 END) as total_duration_minutes,
        ROUND(SUM(CASE WHEN a.check_out_time IS NOT NULL THEN a.duration_minutes ELSE 0 END)::numeric / 60, 2) as total_hours
      FROM users u
      LEFT JOIN attendance_sessions a ON u.id = a.user_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.alias
      ORDER BY total_hours DESC
      LIMIT 20
    `);
    
    console.log('\nUpdated Leaderboard Data:');
    console.table(summary.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixDurations();
