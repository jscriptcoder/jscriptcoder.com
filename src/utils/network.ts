/**
 * Check if a string is a valid IPv4 address
 */
export const isValidIP = (ip: string): boolean => {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
};

/**
 * Parse an IP range string like "192.168.1.1-254"
 * Returns the base IP and start/end of the range
 */
export const parseIPRange = (
  rangeStr: string,
): { baseIP: string; start: number; end: number } | null => {
  const match = rangeStr.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.(\d{1,3})-(\d{1,3})$/);
  if (!match) return null;

  const baseIP = match[1];
  const start = parseInt(match[2], 10);
  const end = parseInt(match[3], 10);

  if (start < 0 || start > 255 || end < 0 || end > 255 || start > end) {
    return null;
  }

  return { baseIP, start, end };
};
