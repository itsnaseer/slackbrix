const { createInstallationStore } = require("./installationStore");

/**
 * Enterprise-first authorize function.
 *
 * Rules:
 * 1. If enterpriseId is present → resolve enterprise installation
 * 2. Else fall back to teamId
 *
 * This mirrors how Slack actually sends auth context for Grid apps.
 */
function createAuthorize({ logger } = {}) {
  const store = createInstallationStore({ logger });

  return async ({ isEnterpriseInstall, enterpriseId, teamId }) => {
    logger?.info?.("[authorize] request", {
      isEnterpriseInstall,
      enterpriseId,
      teamId,
    });

    // 🔑 Enterprise-first resolution (critical for Grid)
    const installation = await store.fetchInstallation({
      enterpriseId: enterpriseId ?? null,
      teamId: enterpriseId ? null : teamId ?? null,
      isEnterpriseInstall: !!enterpriseId,
    });

    if (!installation) {
      throw new Error(
        `[authorize] No installation found (enterpriseId=${enterpriseId}, teamId=${teamId})`
      );
    }

    // Return exactly what Bolt expects
    return {
      botToken: installation.bot?.token,
      botId: installation.bot?.id,
      botUserId: installation.bot?.userId,
      enterpriseId: installation.enterprise?.id,
      teamId: installation.team?.id,
    };
  };
}

module.exports = { createAuthorize };
