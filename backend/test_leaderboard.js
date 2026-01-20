const db = require('./config/database');

async function checkLeaderboardData() {
  try {
    const result = await db.query(`
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
    
    console.log('Leaderboard Data:');
    console.table(result.rows);
    
    // Now check some specific session details
    console.log('\n\nRecent sessions with details:');
    const sessionResult = await db.query(`
      SELECT 
        u.alias,
        a.id,
        a.check_in_time,
        a.check_out_time,
        a.duration_minutes,
        EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time)) / 60 as calculated_minutes
      FROM attendance_sessions a
      JOIN users u ON a.user_id = u.id
      WHERE u.role = 'student'
      ORDER BY a.created_at DESC
      LIMIT 10
    `);
    
    console.table(sessionResult.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLeaderboardData();
