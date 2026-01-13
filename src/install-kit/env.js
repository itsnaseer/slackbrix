require("dotenv").config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function envOptional(name, fallback = undefined) {
  return process.env[name] ?? fallback;
}

function parseScopes(raw) {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { requireEnv, envOptional, parseScopes };
