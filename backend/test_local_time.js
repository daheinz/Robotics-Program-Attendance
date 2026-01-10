// Test the local time formatting
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

console.log('Current local time:', getCurrentLocalTime());
console.log('System timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('Node.js Date:', new Date());
console.log('ISO String (UTC):', new Date().toISOString());
