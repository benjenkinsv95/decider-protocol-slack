/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 ______    ______    ______   __  __    __    ______
 /\  == \  /\  __ \  /\__  _\ /\ \/ /   /\ \  /\__  _\
 \ \  __<  \ \ \/\ \ \/_/\ \/ \ \  _"-. \ \ \ \/_/\ \/
 \ \_____\ \ \_____\   \ \_\  \ \_\ \_\ \ \_\   \ \_\
 \/_____/  \/_____/    \/_/   \/_/\/_/  \/_/    \/_/


 This is a sample Slack Button application that provides a custom
 Slash command.

 This bot demonstrates many of the core features of Botkit:

 *
 * Authenticate users with Slack using OAuth
 * Receive messages using the slash_command event
 * Reply to Slash command both publicly and privately

 # RUN THE BOT:

 Create a Slack app. Make sure to configure at least one Slash command!

 -> https://api.slack.com/applications/new

 Run your bot from the command line:

 clientId=<my client id> clientSecret=<my client secret> PORT=3000 node bot.js

 Note: you can test your oauth authentication locally, but to use Slash commands
 in Slack, the app must be hosted at a publicly reachable IP or host.


 # EXTEND THE BOT:

 Botkit is has many features for building cool and useful bots!

 Read all about it here:

 -> http://howdy.ai/botkit

 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('botkit');

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT || !process.env.VERIFICATION_TOKEN) {
    console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment');
    process.exit(1);
}

var config = {}
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: './db_slackbutton_slash_command/',
    };
}

var controller = Botkit.slackbot(config).configureSlackApp(
    {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        interactive_replies: true,
        // scopes: ['commands', 'bot', 'chat:write', 'post']
        scopes: ['commands','incoming-webhook','team:read','users:read','users.profile:read','channels:read','im:read','im:write','groups:read','emoji:read'],
    }
);

controller.setupWebserver(process.env.PORT, function (err, webserver) {
    controller.createHomepageEndpoint(controller.webserver);
    controller.createWebhookEndpoints(controller.webserver);
    controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});

controller.on('slash_command', function (slashCommand, message) {
    console.log("Slash command");


    switch (message.command) {
        case "/propose": //handle the `/echo` slash command. We might have others assigned to this app too!
            // The rules are simple: If there is no text following the command, treat it as though they had requested "help"
            // Otherwise just echo back to them what they sent us.

            // but first, let's make sure the token matches!
            if (message.token !== process.env.VERIFICATION_TOKEN) return; //just ignore it.

            // if no text was supplied, treat it as a help command
            if (message.text === "" || message.text === "help") {
                slashCommand.replyPrivate(message,
                    "If you type a proposal, I'll give you the text to create a simple poll." +
                    "Try typing `/propose I propose using Spring as a backend.` to see.");
                return;
            }

            var proposal = message.text;
            if(proposal.startsWith("\"")){
                proposal = proposal.substring(1, message.text.length);
            }
            if(proposal.endsWith("\"")){
                proposal = proposal.substring(0, message.text.length - 1);
            }
            if(!proposal.toLowerCase().startsWith("i propose")){
                proposal = "I propose " + proposal;
            }

            var reply = "```/poll \"" + proposal + "\" \":+1: Yes, I agree.\" \":-1: No, but I have an idea for something we could change to get me to agree.\" \":hand: I support the group's choice, but don't feel strongly either way.\" \":-1::-1: No, and there are no changes that would make me agree.\"```";
            slashCommand.replyPublic(message, reply);

            break;

        case "/dev-propose": //handle the `/echo` slash command. We might have others assigned to this app too!
            // The rules are simple: If there is no text following the command, treat it as though they had requested "help"
            // Otherwise just echo back to them what they sent us.

            // but first, let's make sure the token matches!
            if (message.token !== process.env.VERIFICATION_TOKEN) return; //just ignore it.

            // if no text was supplied, treat it as a help command
            if (message.text === "" || message.text === "help") {
                slashCommand.replyPrivate(message,
                    "If you type a proposal, I'll give you the text to create a simple poll." +
                    "Try typing `/propose I propose using Spring as a backend.` to see.");
                return;
            }

            var proposal = message.text;
            if(proposal.startsWith("\"")){
                proposal = proposal.substring(1, message.text.length);
            }
            if(proposal.endsWith("\"")){
                proposal = proposal.substring(0, message.text.length - 1);
            }
            if(!proposal.toLowerCase().startsWith("i propose")){
                proposal = "I propose " + proposal;
            }

            var attachments = {"attachments": [
            {
                callback_id: '123',
                "color": "#009ACD",
                "title": "I propose something",
                "text": "Choices",
                replace_original: 'true',
                'username': 'My bot',
                "fields": [
                    {
                        "title": ":+1: I agree with the proposal.",
                        "value": "@ben",
                        "short": false
                    },{
                        "title": ":hand: I support the group's choice, but don't feel strongly either way.",
                        "value": "@wesley @michael",
                        "short": false
                    },
                    {
                        "title": ":-1: I disagree with the proposal, but I have an idea for something we could change that would make me agree.",
                        "value": "@stephen",
                        "short": false
                    },
                    {
                        "title": ":-1: :-1: I disagree with the proposal, and there are no changes that would make me agree.",
                        "value": "",
                        "short": false
                    }
                ],
                "actions": [
                    {
                        "name": "propose",
                        "text": ":+1:",
                        "type": "button",
                        "style": "primary",
                        "value": "agree"
                    },
                    {
                        "name": "propose",
                        "text": ":hand:",
                        "type": "button",
                        "value": "neutral"
                    },
                    {
                        "name": "propose",
                        "text": ":-1:",
                        "type": "button",
                        "style": "danger",
                        "value": "disagree",
                        "confirm": {
                            "title": "It seems like you disagree with this proposal.",
                            "text": "You should try creating the proposal with your changes!",
                            "dismiss_text": "Ok"
                        }
                    },
                    {
                        "name": "propose",
                        "text": ":-1: :-1:",
                        "style": "danger",
                        "type": "button",
                        "value": "abort",
                        "confirm": {
                            "title": "Are you sure?",
                            "text": "Are there really no changes that would get you on board with the proposal's intent?",
                            "ok_text": "Yes",
                            "dismiss_text": "No"
                        }
                    }
                ],
                "footer": "A Decider Protocol Poll",
                "ts": 123456789
            }
        ]
    };
            slashCommand.reply(message, attachments);
            // slashCommand.startConversation(message, function(err, convo) {
            //     convo.ask(attachments);
            // });

            break;
        default:
            slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }
})
;

// receive an interactive message, and reply with a message that will replace the original
controller.on('interactive_message_callback', function(bot, message) {
    console.log("Interactive message");

    // check message.actions and message.callback_id to see what action to take...

    switch(message.callback_id) {
        case "123":
            bot.replyInteractive(message, "Button works!");
            break;
        // Add more cases here to handle for multiple buttons
        default:
            // For debugging
            bot.replyInteractive(message, 'The callback ID has not been defined');
    }

});


controller.on('create_bot',function(bot,config) {
    if (_bots[bot.config.token]) {
        // already online! do nothing.
    } else {
        bot.startRTM(function(err) {
            if (!err) {
                trackBot(bot);
            }
            bot.startPrivateConversation({user: config.createdBy},function(err,convo) {
                if (err) {
                    console.log(err);
                } else {
                    convo.say('I am a bot that has just joined your team');
                    convo.say('You must now /invite me to a channel so that I can be of use!');
                }
            });
        });
    }
});

// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});

// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
    _bots[bot.config.token] = bot;
}

//REQUIRED FOR INTERACTIVE MESSAGES
controller.storage.teams.all(function(err,teams) {

    if (err) {
        throw new Error(err);
    }

    // connect all teams with bots up to slack!
    for (var t  in teams) {
        if (teams[t].bot) {
            controller.spawn(teams[t]).startRTM(function(err, bot) {
                if (err) {
                    console.log('Error connecting bot to Slack:',err);
                } else {
                    console.log(bot);
                    trackBot(bot);
                }
            });
        }
    }

});