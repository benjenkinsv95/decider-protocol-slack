"use strict";
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Read all the docs on botkit @ https://github.com/howdyai/botkit
Read all the Slack API docs @ https://api.slack.com/ (especially the bit on interactive buttons)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
Object.defineProperty(exports, "__esModule", { value: true });
var botkitPlumbing = require("./botkit_plumbing");
var Botkit = require('./node_modules/botkit/lib/Botkit.js');
botkitPlumbing.loadEnvironmentVariablesFromConfig();
var controller = botkitPlumbing.getController(Botkit);
var os = require('os');
var express = require('express');
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
    if (shouldAdd) {
        members.push(name);
    }
    return members.join(" ");
}
function getMessageAttachments(proposal, name, buttonValue, message) {
    var agreeMembers = "";
    var neutralMembers = "";
    var disagreeMembers = "";
    var hellNoMembers = "";
    if (message !== undefined) {
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
                    }, {
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
                            "text": "Use this option with great discretion and as infrequently as possible. If you have a better idea, please share it.",
                            "ok_text": "Yes",
                            "dismiss_text": "No"
                        }
                    }
                ],
                "footer": "The Decider Protocol | <https://github.com/benjenkinsv95/decider-protocol-slack/blob/master/decider-protocol.md|Learn More :information_source:>"
            }
        ],
        "delete_original": false
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
            if (message.token !== process.env.token) {
                return; //just ignore it.
            }
            // if no text was supplied, treat it as a help command
            if (message.text === "" || message.text === "help") {
                slashCommand.replyPrivate(message, "If you type a proposal, I'll give you the text to create a simple poll." +
                    "Try typing `/propose I propose using Spring as a backend.` to see.");
                return;
            }
            var proposal = message.text;
            if (proposal.startsWith("\"")) {
                proposal = proposal.substring(1, message.text.length);
            }
            if (proposal.endsWith("\"")) {
                proposal = proposal.substring(0, message.text.length - 1);
            }
            if (!proposal.toLowerCase().startsWith("i propose")) {
                proposal = "I propose " + proposal;
            }
            proposal = proposal + "\n";
            var newMessage = getMessageAttachments(proposal, undefined, "", undefined);
            newMessage.delete_original = true;
            slashCommand.replyPublic(message, newMessage);
            break;
        default:
            slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");
    }
});
// This controller method handles every interactive button click
controller.on('interactive_message_callback', function (bot, message) {
    // These 3 lines are used to parse out the id's
    var ids = message.callback_id.split(/\-/);
    var user_id = ids[0];
    var item_id = ids[1];
    console.log("Interactive message");
    console.log(message);
    var callbackId = message.callback_id;
    // Example use of Select case method for evaluating the callback ID
    // Callback ID 123 for weather bot webcam
    switch (callbackId) {
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
