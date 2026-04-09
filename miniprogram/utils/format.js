function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatTime(date) {
  if (!date) return "";
  const d = new Date(date);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day} ${h}:${min}`;
}

module.exports = {
  formatTime
};
