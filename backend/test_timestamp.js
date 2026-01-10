const db = require('./config/database');

(async () => {
  try {
    console.log('Testing timestamp storage...\n');
    
    const testTimestamp = '2026-01-10T16:30:00';
    console.log('Input string:', testTimestamp);
    
    const result = await db.query(
      'SELECT $1::timestamp as stored_value, $1::timestamp::text as stored_text',
      [testTimestamp]
    );
    
    console.log('Stored as Date object:', result.rows[0].stored_value);
    console.log('Stored as text:', result.rows[0].stored_text);
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
})();
