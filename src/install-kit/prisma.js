// src/install-kit/prisma.js
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

// singleton
const prisma = new PrismaClient({ adapter });

// compatibility for callers expecting getPrisma()
function getPrisma() {
  return prisma;
}

module.exports = { prisma, getPrisma };