/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Example Slack botkit project

Read all the docs on botkit @ https://github.com/howdyai/botkit
Read all the Slack API docs @ https://api.slack.com/ (especially the bit on interactive buttons)

This project is all you need to get up and running with interactive messages

* Works with interactive buttons
* Includes sample 'interactive_message_callback' method
* Includes sample help method
* Includes uptime method
* Includes config file for tokens
* Includes a method to get cat gifs on demand.

To get your App up and running:
    *Make sure you are using a Slack App and have a bot user set
    *Plug your tokens and secrets into the config file (Found by managing your App here: https://api.slack.com)
    *Make sure you have localtunnel running with the url set in your app credentials under redirect URI. (https://api.slack.com -> https://yoursubdomain.localtunnel.me/oauth)
    *Make sure you have your Request URL for interactive messages set to https://yoursubdomain.localtunnel.me/slack/receive
    *Run your bot with "node yourbot.js"
    *Hit the URL "https://yoursubdomain.localtunnel.me/login" to add your bot to a team
    *Direct message your bot "test button" to make sure buttons are working
    *Invite your bot to a channel and have fun!

Created by Christian Hapgood
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// Have a remote json config file for holding tokens. add this file to your gitignore.
var config = require('./config.json');
process.env.token = config.token;
process.env.clientId = config.clientId;
process.env.clientSecret = config.clientSecret;
process.env.port = config.port;

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./node_modules/botkit/lib/Botkit.js');
var os = require('os');
var express = require('express');
// Using a token to get user information. Generate a token here https://api.slack.com/docs/oauth-test-tokens
var userToken = config.userToken;

// Check for ENV variables - Required to be a slack app to use interactive buttons
if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
    console.log('Error: Specify clientId clientSecret and port in environment');
    process.exit(1);
}

// Sample controller config - REQUIRED FOR INTERACTIVE BUTTONS
var controller = Botkit.slackbot({
                                     debug: false,
                                     interactive_replies: true, // tells botkit to send button clicks into conversations
                                     json_file_store: './db_slackbutton_bot/',
                                 }).configureSlackApp(
    {
        clientId: process.env.clientId,
        clientSecret: process.env.clientSecret,
        // Set scopes as needed. https://api.slack.com/docs/oauth-scopes
        scopes: ['commands', 'bot','incoming-webhook','team:read','users:read','users.profile:read','channels:read','im:read','im:write','groups:read','emoji:read','chat:write:bot'],
    }
);

// Setup for the Webserver - REQUIRED FOR INTERACTIVE BUTTONS
controller.setupWebserver(process.env.port,function(err,webserver) {
    controller.createWebhookEndpoints(controller.webserver);

    controller.createOauthEndpoints(controller.webserver,function(err,req,res) {
        if (err) {
            res.status(500).send('ERROR: ' + err);
        } else {
            res.send('Success!');
        }
    });
});

function arrayRemove(array, search_term) {
    for (var i = array.length - 1; i >= 0; i--) {
        if (array[i] === search_term) {
            array.splice(i, 1);
        }
    }
}

function getUpdatedMembers(name, currentMembers, shouldAdd) {
    var members = currentMembers.split(" ");
    arrayRemove(members, name);
    if(shouldAdd){
        members.push(name)
    }
    return members.join(" ");
}

function getMessageAttachments(proposal, name, buttonValue, message) {
    var agreeMembers = "";
    var neutralMembers = "";
    var disagreeMembers = "";
    var hellNoMembers = "";
    if(message !== undefined) {
        var fields = JSON.parse(message.payload).original_message.attachments[0].fields;
        agreeMembers = getUpdatedMembers(name, fields[0].value, buttonValue === "agree");
        neutralMembers = getUpdatedMembers(name, fields[1].value, buttonValue === "neutral");
        disagreeMembers = getUpdatedMembers(name, fields[2].value, buttonValue === "disagree");
        hellNoMembers = getUpdatedMembers(name, fields[3].value, buttonValue === "abort");
        proposal = JSON.parse(message.payload).original_message.attachments[0].title;
    }

    return {
        "attachments": [
        {
            "title": proposal,
            callback_id: '123',
            "color": "#009ACD",
            replace_original: 'true',
            'username': 'My bot',
            "fields": [
                {
                    "title": ":+1: Yes, I agree.",
                    "value": agreeMembers,
                    "short": false
                },{
                    "title": ":hand: I support it.",
                    "value": neutralMembers,
                    "short": false
                },
                {
                    "title": ":-1: No, I disagree.",
                    "value": disagreeMembers,
                    "short": false
                },
                {
                    "title": ":-1: :-1: I am an absolute no. I won’t get in.",
                    "value": hellNoMembers,
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
                        "title": "What will it take to get you in?",
                        "text": "Please tell the proposer what changes to the proposal are needed to make you agree."
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
                        "text": "Use with great discretion and as infrequently as possible. If you have a better idea, please share it.",
                        "ok_text": "Yes",
                        "dismiss_text": "No"
                    }
                }
            ],
            "footer": "The Decider Protocol | <https://liveingreatness.com/core-protocols/decider/|Learn More>"
        }
    ]
    };
}

controller.on('slash_command', function (slashCommand, message) {
    console.log("Slash command");
    // slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    switch (message.command) {
        case "/propose": //handle the `/echo` slash command. We might have others assigned to this app too!
            // The rules are simple: If there is no text following the command, treat it as though they had requested "help"
            // Otherwise just echo back to them what they sent us.

            // but first, let's make sure the token matches!
            if (message.token !== process.env.token){
                return; //just ignore it.
            }

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

            proposal = proposal + "\n";

            message.delete_original = true;
            slashCommand.replyPublic(message, getMessageAttachments(proposal, undefined, "", undefined));

            break;
        default:
            slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }
});


// Method for when the bot is added to a team
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
                    console.log("ERROR" + JSON.stringify(err));
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

//REQUIRED FOR INTERACTIVE BUTTONS
// This controller method handles every interactive button click
controller.on('interactive_message_callback', function(bot, message) {
    // These 3 lines are used to parse out the id's
    var ids = message.callback_id.split(/\-/);
    var user_id = ids[0];
    var item_id = ids[1];
    console.log("Interactive message");
    console.log(message);

    var callbackId = message.callback_id;

    // Example use of Select case method for evaluating the callback ID
    // Callback ID 123 for weather bot webcam
    switch(callbackId) {
        case "123":
    var referenceUser = "<@" + message.user + ">";
    bot.replyInteractive(message, getMessageAttachments(undefined, referenceUser, message.actions[0].value, message));

    break;
    // Add more cases here to handle for multiple buttons
default:
    // For debugging
    bot.reply(message, 'The callback ID has not been defined');
}
});

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
                    console.log("INFO");
                    // console.log(bot);
                    trackBot(bot);
                }
            });
        }
    }

});