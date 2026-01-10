const db = require('./config/database');

function getCurrentLocalTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

(async () => {
  try {
    const localTime = getCurrentLocalTime();
    console.log('Current local time from Node.js:', localTime);
    
    const result = await db.query(
      'SELECT $1::timestamp as stored_value, $1::timestamp::text as stored_text, CURRENT_TIMESTAMP as db_current_timestamp',
      [localTime]
    );
    
    console.log('Stored as Date object:', result.rows[0].stored_value);
    console.log('Stored as text in DB:', result.rows[0].stored_text);
    console.log('Database CURRENT_TIMESTAMP:', result.rows[0].db_current_timestamp);
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
})();
