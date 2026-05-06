export type DataSource = "mock" | "sqlite" | "supabase";

export const getDataSource = (): DataSource => {
  const raw = process.env.APP_DATA_SOURCE?.toLowerCase();
  if (raw === "supabase") return "supabase";
  if (raw === "mock") return "mock";
  // Default: real local SQLite database (persistent, no external services).
  return "sqlite";
};

export const isSupabaseConfigured = () =>
  Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const getSqliteFilePath = () =>
  process.env.APP_SQLITE_PATH && process.env.APP_SQLITE_PATH.trim().length > 0
    ? process.env.APP_SQLITE_PATH
    : "data/watchlab.db";

export const isDemoAuthEnabled = () => process.env.ENABLE_DEMO_AUTH !== "false";

export const getSessionMaxAgeSeconds = () => {
  const raw = Number(process.env.APP_SESSION_MAX_AGE_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : 60 * 60 * 24 * 7;
};

export const getSessionSecret = () => {
  const secret = process.env.APP_SESSION_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_SESSION_SECRET is required in production");
  }

  return "watch-lab-dev-session-secret";
};
