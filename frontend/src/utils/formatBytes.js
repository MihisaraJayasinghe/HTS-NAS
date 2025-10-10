const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

const formatBytes = (value) => {
  if (!Number.isFinite(value) || value < 0) {
    return '0 B';
  }
  if (value === 0) {
    return '0 B';
  }
  let current = value;
  let unitIndex = 0;
  while (current >= 1024 && unitIndex < UNITS.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }
  const precision = current >= 100 ? 0 : current >= 10 ? 1 : 2;
  return `${current.toFixed(precision)} ${UNITS[unitIndex]}`;
};

export default formatBytes;

