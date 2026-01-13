const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

function compositeId(enterpriseId, teamId) {
    return `${enterpriseId ?? "none"}::${teamId ?? "none"}`;
}

function normalizeIdsFromInstallation(installation) {
    const enterpriseId =
        installation.enterprise?.id ?? installation.enterpriseId ?? null;
    const teamId = installation.team?.id ?? installation.teamId ?? null;
    return { enterpriseId, teamId };
}

function normalizeIdsFromQuery(query) {
    const enterpriseId = query.enterprise?.id ?? query.enterpriseId ?? null;
    const teamId = query.team?.id ?? query.teamId ?? null;
    const isEnterpriseInstall =
        query.isEnterpriseInstall === true || query.isEnterpriseInstall === "true";
    return { enterpriseId, teamId, isEnterpriseInstall };
}

const installationStore = {
    storeInstallation: async (installation) => {
        const { enterpriseId, teamId } = normalizeIdsFromInstallation(installation);
        const id = compositeId(enterpriseId, teamId);

        await prisma.installation.upsert({
            where: { id },
            update: {
                enterpriseId,
                teamId,
                botToken: installation.bot?.token || "",
                botId: installation.bot?.id || null,
                botUserId: installation.bot?.userId || null,
                installerUser: installation.user?.id || null,
                scope: installation.bot?.scopes?.join(",") || null,
                appId: installation.appId || installation.app_id || null,
                tokenType: installation.tokenType || "bot",
            },
            create: {
                id,
                enterpriseId,
                teamId,
                botToken: installation.bot?.token || "",
                botId: installation.bot?.id || null,
                botUserId: installation.bot?.userId || null,
                installerUser: installation.user?.id || null,
                scope: installation.bot?.scopes?.join(",") || null,
                appId: installation.appId || installation.app_id || null,
                tokenType: installation.tokenType || "bot",
            },
        });
    },

    fetchInstallation: async (query) => {
        const { enterpriseId, teamId, isEnterpriseInstall } =
            normalizeIdsFromQuery(query);

        let row = null;
        if (enterpriseId !== null && teamId !== null) {
            row = await prisma.installation.findUnique({
                where: { id: compositeId(enterpriseId, teamId) },
            });
        }

        if (!row && enterpriseId !== null) {
            const id = compositeId(enterpriseId, isEnterpriseInstall ? null : teamId);
            row = await prisma.installation.findUnique({ where: { id } }).catch(() => null);
        }

        if (!row && teamId !== null) {
            row = await prisma.installation.findUnique({
                where: { id: compositeId(null, teamId) },
            }).catch(() => null);
        }

        if (!row) {
            throw new Error(
                `Installation not found for enterpriseId=${enterpriseId ?? "null"} teamId=${teamId ?? "null"}`
            );
        }

        return {
            enterprise: row.enterpriseId ? { id: row.enterpriseId } : undefined,
            team: row.teamId ? { id: row.teamId } : undefined,
            bot: {
                token: row.botToken,
                id: row.botId || undefined,
                userId: row.botUserId || undefined,
                scopes: row.scope ? row.scope.split(",") : undefined,
            },
            user: row.installerUser ? { id: row.installerUser } : undefined,
            appId: row.appId || undefined,
            tokenType: row.tokenType || "bot",
        };
    },

    deleteInstallation: async (query) => {
        const { enterpriseId, teamId, isEnterpriseInstall } =
            normalizeIdsFromQuery(query);

        const id =
            enterpriseId !== null && teamId !== null
                ? compositeId(enterpriseId, teamId)
                : enterpriseId !== null
                ? compositeId(enterpriseId, isEnterpriseInstall ? null : teamId)
                : compositeId(null, teamId);

        await prisma.installation.delete({ where: { id } }).catch(() => {});
    },
};

module.exports = { installationStore };
