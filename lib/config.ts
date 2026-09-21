export function getMissingConfig() {
  return ["DATABASE_URL", "ADMIN_PASSWORD", "AUTH_SECRET"].filter(
    (key) => !process.env[key]
  );
}

export function isConfigured() {
  return getMissingConfig().length === 0;
}
