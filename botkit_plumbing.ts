export function loadEnvironmentVariablesFromConfig() {
    // Have a remote json config file for holding tokens. add this file to your gitignore.
    let config = require('./config.json');
    process.env.token = config.token;
    process.env.clientId = config.clientId;
    process.env.clientSecret = config.clientSecret;
    process.env.port = config.port;
    process.env.userToken = config.userToken;

    if (!process.env.token) {
        console.log('Error: Specify token in environment');
        process.exit(1);
    }

    // Check for ENV variables - Required to be a slack app to use interactive buttons
    if (!process.env.clientId || !process.env.clientSecret || !process.env.port) {
        console.log('Error: Specify clientId clientSecret and port in environment');
        process.exit(1);
    }
}

// Sample controller config - REQUIRED FOR INTERACTIVE BUTTONS
export function getController(Botkit) {
    var controller = Botkit.slackbot({
        debug: false,
        interactive_replies: true, // tells botkit to send button clicks into conversations
        json_file_store: './db_slackbutton_bot/',
    }).configureSlackApp(
        {
            clientId: process.env.clientId,
            clientSecret: process.env.clientSecret,
            redirectUri: null,
            // Set scopes as needed. https://api.slack.com/docs/oauth-scopes
            scopes: ['commands', 'bot', 'incoming-webhook', 'team:read', 'users:read', 'users.profile:read', 'channels:read', 'im:read', 'im:write', 'groups:read', 'emoji:read', 'chat:write:bot'],
        }
    );

    // Setup for the Webserver - REQUIRED FOR INTERACTIVE BUTTONS
    controller.setupWebserver(process.env.port, function (err, webserver) {
        controller.createWebhookEndpoints(controller.webserver);

        controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
            if (err) {
                res.status(500).send('ERROR: ' + err);
            } else {
                res.send('Success!');
            }
        });
    });

    //REQUIRED FOR INTERACTIVE MESSAGES
    controller.storage.teams.all(function (err, teams) {

        if (err) {
            throw new Error(err);
        }

        // connect all teams with bots up to slack!
        for (var t  in teams) {
            if (teams[t].bot) {
                controller.spawn(teams[t]).startRTM(function (err, bot) {
                    if (err) {
                        console.log('Error connecting bot to Slack:', err);
                    } else {
                        console.log("INFO");
                        // console.log(bot);
                        trackBot(bot);
                    }
                });
            }
        }

    });

    // Method for when the bot is added to a team
    controller.on('create_bot', function (bot, config) {
        if (_bots[bot.config.token]) {
            // already online! do nothing.
        } else {
            bot.startRTM(function (err) {
                if (!err) {
                    trackBot(bot);
                }
                bot.startPrivateConversation({user: config.createdBy}, function (err, convo) {
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
    controller.on('rtm_open', function (bot) {
        console.log('** The RTM api just connected!');
    });

    controller.on('rtm_close', function (bot) {
        console.log('** The RTM api just closed');
        // you may want to attempt to re-open
    });

    // just a simple way to make sure we don't
    // connect to the RTM twice for the same team
    var _bots = {};

    function trackBot(bot) {
        _bots[bot.config.token] = bot;
    }


    return controller
}