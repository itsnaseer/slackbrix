require("dotenv").config();

const { App } = require("@slack/bolt");
const { receiver } = require("./slack/receiver");

const app = new App({
  receiver
});

// functional logic
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
        icon_url: demo_users_data["amira_valant"]?.image_512,
        text: "Yes, per Sec. 3.4.1 Exception, approve with the lease and a follow-up task to get the agreement by next week. Action must be taken now. I'll flag the utility company for a 2-hour hold.",
        username:"Amira Valant",
        thread_ts:firstMessage.ts
    });

});



//Start the app

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ Slackbrix listening on :${port}`);
})();
