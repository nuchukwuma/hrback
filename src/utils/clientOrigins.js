export const clientOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const clientUrl = clientOrigins[0] || '';
