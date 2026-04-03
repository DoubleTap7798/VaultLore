const fallbackApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://api.vaultlore.app/v1"
    : "http://localhost:4000/v1");

function validateApiUrl(value: string) {
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_API_URL: ${value}`);
  }
}

export const webEnv = {
  NEXT_PUBLIC_API_URL: validateApiUrl(fallbackApiUrl)
};
