const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { requireEnv } = require("./env");

let prisma; // singleton

function getPrisma() {
  if (prisma) return prisma;

  const adapter = new PrismaPg({
    connectionString: requireEnv("DATABASE_URL"),
  });

  prisma = new PrismaClient({ adapter });
  return prisma;
}

module.exports = { getPrisma };
