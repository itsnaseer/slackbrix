require("dotenv").config();

const requiredEnv = [
    "SLACK_SIGNING_SECRET",
    "SLACK_CLIENT_ID",
    "SLACK_CLIENT_SECRET",
    "SLACK_STATE_SECRET",
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
    console.error(
        `Missing required environment variables: ${missingEnv.join(", ")}. ` +
            "Check your .env file."
    );
}

const { App, ExpressReceiver } = require("@slack/bolt");
const { installationStore } = require("./installationStore");

const defaultScopes = [
    "channels:history",
    "channels:join",
    "channels:manage",
    "channels:read",
    "channels:write.invites",
    "chat:write",
    "chat:write.customize",
    "groups:history",
    "groups:write",
    "groups:write.invites",
    "im:history",
    "im:write",
    "mpim:write",
    "users:read"
];
const scopes = (process.env.SLACK_SCOPES || "")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
const oauthScopes = scopes.length ? scopes : defaultScopes;


const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: process.env.SLACK_STATE_SECRET,
    scopes: oauthScopes,
    installPath: "/oauth/start",
    redirectUriPath: "/oauth/callback",
    installerOptions: {
        authVersion: "v2",
        directInstall: true,
    },
    installationStore,
});

receiver.app.use((req, res, next) => {
    if (req.method === "POST" && req.path === "/slack/events") {
        const body = req.body;
        if (body?.type === "url_verification" && body?.challenge) {
            console.log("[SLACK] url_verification received");
            return res.status(200).send(body.challenge);
        }
    }

    next();
});

const app = new App({
    receiver,
});

// Basic request logging (helpful when debugging ngrok + OAuth routes)
receiver.app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl}`);
    next();
});

// Log OAuth installer hits explicitly
receiver.app.use((req, _res, next) => {
    if (req.path === "/oauth/start" || req.path === "/oauth/callback") {
        console.log(`[OAUTH] ${req.method} ${req.originalUrl}`);
    }
    next();
});

receiver.app.get("/", (_req, res) => {
    const redirectUri = process.env.PUBLIC_BASE_URL
        ? `?redirect_uri=${process.env.PUBLIC_BASE_URL}/oauth/callback`
        : "";
    res.send(`
    <html>
      <head><title>Slackbrix</title></head>
      <body style="font-family: ui-sans-serif; padding: 40px;">
        <h1>Slackbrix</h1>
        <p>Install the app to start the demo conversation flow.</p>
        <a href="/oauth/start${redirectUri}"><img
          alt="Add to Slack"
          height="40"
          src="https://platform.slack-edge.com/img/add_to_slack.png"
          srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x,
                  https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"/></a>
      </body>
    </html>
  `);
});

// async function autoJoinUserChannels(botClient, userToken) {
//     if (!userToken) {
//         console.log("SLACK_USER_TOKEN not set; skipping auto-join.");
//         return;
//     }

//     let cursor;
//     let joinedCount = 0;
//     let skippedCount = 0;

//     do {
//         const result = await botClient.conversations.list({
//             token: userToken,
//             limit: 1000,
//             types: "public_channel,private_channel",
//             cursor,
//             exclude_archived: true,
//         });

//         const channels = result.channels || [];
//         for (const channel of channels) {
//             if (!channel.is_member) {
//                 continue;
//             }

//             try {
//                 await botClient.conversations.join({ channel: channel.id });
//                 joinedCount += 1;
//             } catch (error) {
//                 const errorCode = error?.data?.error;
//                 if (
//                     errorCode === "already_in_channel" ||
//                     errorCode === "method_not_supported_for_channel_type" ||
//                     errorCode === "channel_not_found"
//                 ) {
//                     skippedCount += 1;
//                     continue;
//                 }

//                 throw error;
//             }
//         }

//         cursor = result.response_metadata?.next_cursor;
//     } while (cursor);

//     console.log(
//         `Auto-join finished. Joined: ${joinedCount}, skipped: ${skippedCount}`
//     );
// }

async function getDemoUsers(demo_usernames, client) {
    const remaining = new Set(demo_usernames);
    const demoUsers = {};
    let cursor;
    do {
        const result = await client.users.list({
            limit: 1000,
            cursor,
        });
        for (const user of result.members || []) {
            if (!user?.id || user?.deleted || !remaining.has(user.name)) {
                continue;
            }
            demoUsers[user.name] = {
                id: user.id,
                image_512: user.profile?.image_512,
                display_name:
                    user.profile?.display_name || user.real_name || user.name,
            };
            remaining.delete(user.name);
        }
        cursor = result.response_metadata?.next_cursor;
    } while (cursor && remaining.size > 0);

    return demoUsers;
}



function delay(delay_seconds) {
    return new Promise((resolve) => setTimeout(resolve, delay_seconds*1000));//convert the delay to milliseconds
}

app.event("channel_created", async ({ event, client }) => {
    try {
        await client.conversations.join({ channel: event.channel.id });
    } catch (error) {
        const errorCode = error?.data?.error;
        if (
            errorCode !== "already_in_channel" &&
            errorCode !== "method_not_supported_for_channel_type"
        ) {
            throw error;
        }
    }
});

app.message("I need help.", async ({message, client }) => {
    if (message.subtype || message.bot_id) {
        return;
    }


    //add Slackbrix to the demo channel
    try {
        await client.conversations.join({ channel: message.channel }); //make sure the app is in the channel
    } catch (error) {
        const errorCode = error?.data?.error;
        if (errorCode !== "already_in_channel" && errorCode !== "method_not_supported_for_channel_type") {
            throw error;
        }
    }

    //add demo users to the channel

    const demo_users=["jennifer_hynes","alyssa_buron","amira_valant"];

    const demo_users_data = await getDemoUsers(demo_users, client);
    const demo_user_ids = Object.values(demo_users_data).map(
        (demo_user) => demo_user.id
    );

    try{
        for(const demo_user_id of demo_user_ids){
            await client.conversations.invite({channel:message.channel, users:demo_user_id});
        }
    }
    catch(error){
        const errorCode = error?.data?.error;
        if (errorCode !== "already_in_channel" && errorCode !== "method_not_supported_for_channel_type" && errorCode !=="cant_invite_self") {
            throw error;
        }
        console.log("Some demo users could not be added to the channel: "+errorCode);
    }

    //push the messages with delays to simulate a conversation 

    await delay(1); //wait 3 seconds

    await client.chat.postMessage({
        channel: message.channel,
        icon_url: demo_users_data["amira_valant"]?.image_512,
        text: "Applicant has a shut-off notice for today, meets income, but the Lease Agreement is has a missing signature from the landlord. Policy says 'Landlord Agreement required.' Can a Senior Reviewer/Supervisor approve an override with the lease, given the crisis, or do we need to contact the utility company for a hold first?",
        username:"Amira Valant"
    });

    await delay(2); 

    const firstMessage = await client.chat.postMessage({
        channel: message.channel,
        icon_url: demo_users_data["alyssa_buron"]?.image_512,
        text: "Can a Senior Reviewer/Supervisor approve an override with the lease, given the crisis, or do we need to contact the utility company for a hold first?",
        username:"Alyssa Buron"
    });

    await delay(1); 

    await client.chat.postMessage({
        channel: message.channel,
        icon_url: demo_users_data["dave_edwards"]?.image_512,
        text: "Yes, per Sec. 3.4.1 Exception, approve with the lease and a follow-up task to get the agreement by next week. Action must be taken now. I'll flag the utility company for a 2-hour hold.",
        username:"Dave Edwards",
        thread_ts:firstMessage.ts
    });

});

const port = Number(process.env.PORT) || 3000;

(async () => {
    await app.start(port);
    console.log(`Slack app listening on port ${port}`);
    //void autoJoinUserChannels(app.client, process.env.SLACK_USER_TOKEN);
})();
