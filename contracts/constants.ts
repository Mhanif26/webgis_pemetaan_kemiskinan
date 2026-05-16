export const Session = {
  cookieName: "webgis_sid",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const LocalAuth = {
  defaultAdminEmail: "admin@local.test",
  defaultAdminPassword: "Admin123!",
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
} as const;
