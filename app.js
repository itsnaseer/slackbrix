require("dotenv").config();
const http = require("http");
const { App, ExpressReceiver } = require("@slack/bolt");

const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

receiver.app.use((req, res, next) => {
    if (
        req.method === "POST" &&
        req.url === "/slack/events" &&
        req.body &&
        req.body.type === "url_verification" &&
        req.body.challenge
    ) {
        res.status(200).send(req.body.challenge);
        return;
    }

    next();
});

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver,
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

app.message("hello", async ({message, client }) => {
    if (message.subtype || message.bot_id) {
        return;
    }

    try {
        await client.conversations.join({ channel: message.channel }); //make sure the app is in the channel
    } catch (error) {
        const errorCode = error?.data?.error;
        if (errorCode !== "already_in_channel" && errorCode !== "method_not_supported_for_channel_type") {
            throw error;
        }
    }

    await delay(3); //wait 3 seconds

    await client.chat.postMessage({
        channel: message.channel,
        icon_url:"https://ca.slack-edge.com/E06J0E127UG-U06GX46SP0X-19eebf4f6809-512",
        text: "hi",
        username:"Dave Edwards"
    });

    await delay(3); //wait 3 seconds

    const firstMessage = await client.chat.postMessage({
        channel: message.channel,
        icon_url:"https://ca.slack-edge.com/E06J0E127UG-U06GX452HST-b7ed2a6b57b0-512",
        text: "howdy",
        username:"Alyssa Buron"
    });

    await client.chat.postMessage({
        channel: message.channel,
        icon_url:"https://ca.slack-edge.com/E06J0E127UG-U06GX452HST-b7ed2a6b57b0-512",
        text: "howdy",
        username:"Alyssa Buron",
        thread_ts:firstMessage.ts
    });

});

const port = Number(process.env.PORT) || 3000;
const server = http.createServer(receiver.app);

server.listen(port, () => {
    console.log(`Slack app listening on port ${port}`);
    void autoJoinUserChannels(app.client, process.env.SLACK_USER_TOKEN);
});
