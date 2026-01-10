// Test how the timestamp is displayed
const timestamp = '2026-01-10T22:30:00.000Z';  // What pg driver returns
const d = new Date(timestamp);

console.log('Input from pg driver:', timestamp);
console.log('JavaScript Date object:', d);
console.log('getHours():', d.getHours());
console.log('getMinutes():', d.getMinutes());
console.log('toLocaleString():', d.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
console.log('toLocaleString() (browser default):', d.toLocaleString());

// Simulate formatDateTime function
const month = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
const year = String(d.getFullYear()).slice(-2);
let hours = d.getHours();
const minutes = String(d.getMinutes()).padStart(2, '0');
const ampm = hours >= 12 ? 'PM' : 'AM';
hours = hours % 12 || 12;
const formatted = `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
console.log('formatDateTime result:', formatted);
