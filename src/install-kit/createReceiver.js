const { ExpressReceiver, LogLevel } = require("@slack/bolt");
const { requireEnv, parseScopes } = require("./env");
const { createInstallationStore } = require("./installationStore");

function createReceiver() {
  const receiver = new ExpressReceiver({
    signingSecret: requireEnv("SLACK_SIGNING_SECRET"),
    clientId: requireEnv("SLACK_CLIENT_ID"),
    clientSecret: requireEnv("SLACK_CLIENT_SECRET"),
    stateSecret: requireEnv("SLACK_STATE_SECRET"),

    scopes: parseScopes(requireEnv("SLACK_SCOPES")),

    installationStore: createInstallationStore(),

    installerOptions: {
      installPath: "/slack/install",
      redirectUriPath: "/slack/oauthcallback",
      directInstall: true,
      stateVerification: false,
    },


    logLevel: LogLevel.DEBUG,
  });

  return receiver;
}

module.exports = { createReceiver };
