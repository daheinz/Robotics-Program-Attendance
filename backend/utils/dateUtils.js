function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function formatDateTime(date) {
  return new Date(date).toISOString();
}

function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.floor((end - start) / 1000 / 60); // minutes
}

function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

module.exports = {
  formatDate,
  formatDateTime,
  calculateDuration,
  isValidDate,
};
