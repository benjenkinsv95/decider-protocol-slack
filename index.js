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
        scopes: ['commands']
    }
);

controller.setupWebserver(process.env.PORT, function (err, webserver) {
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

            slashCommand.startConversation(message, function(err, convo) {

                slashCommand.ask({
                              attachments:[
                                  {
                                      title: 'Do you want to proceed?',
                                      callback_id: '123',
                                      attachment_type: 'default',
                                      actions: [
                                          {
                                              "name":"yes",
                                              "text": "Yes",
                                              "value": "yes",
                                              "type": "button",
                                          },
                                          {
                                              "name":"no",
                                              "text": "No",
                                              "value": "no",
                                              "type": "button",
                                          }
                                      ]
                                  }
                              ]
                          },[
                              {
                                  pattern: "yes",
                                  callback: function(reply, convo) {
                                      convo.say('FABULOUS!');
                                      convo.next();
                                      // do something awesome here.
                                  }
                              },
                              {
                                  pattern: "no",
                                  callback: function(reply, convo) {
                                      convo.say('Too bad');
                                      convo.next();
                                  }
                              },
                              {
                                  default: true,
                                  callback: function(reply, convo) {
                                      // do nothing
                                  }
                              }
                          ]);
            });

            break;
        default:
            slashCommand.replyPublic(message, "I'm afraid I don't know how to " + message.command + " yet.");

    }
})
;

