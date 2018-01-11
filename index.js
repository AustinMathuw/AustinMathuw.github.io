'use strict';
const Alexa = require("alexa-sdk");
var Trello = require("node-trello"); //https://www.npmjs.com/package/node-trello
const appId = ''; //'amzn1.echo-sdk-ams.app.your-skill-id';

exports.handler = function(event, context, callback) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = appId;
    alexa.dynamoDBTableName = 'trelloUsers';
    alexa.registerHandlers(newSessionHandlers, mainPortalHandlers, referenceHandlers);
    alexa.execute();
};

const states = {
    MAINPORTAL: '_MAINPORTAL', // User would like to switch states
    REFERENCE: '_REFERENCE', // User would like Reference about Trello.
    ACCOUNT: '_ACCOUNT'  // User would like to gather or modify account information
};

const newSessionHandlers = {
    'NewSession': function() {
        console.log("NEWSESSION");
        if(Object.keys(this.attributes).length === 0) {
            this.attributes['Trello'] = new Trello("c64bc8f6004ebe33ff5cfbef9b380bb6", this.event.session.user.accessToken);
            this.attributes["currentState"] = states.MAINPORTAL;
        }
        this.attributes['Trello'].get("/1/members/me", function(err, data) {
            console.log("GET: /1/members/me");
            if (err){
                console.log("Fail: " + err);
                this.emit('InvalidToken');
            } else {
                console.log("Success: " + data);
                this.attributes['UserFullName'] = data.fullName;
                this.attributes['UserName'] = data.username;
                this.attributes['UserEmail'] = data.email;
                this.attributes['UserMemberType'] = data.memberType;
                this.attributes['UserInitials'] = data.initials;
                this.attributes['UserId'] = data.id;
                this.attributes['Trello'].get("/1/members/me/boards", function(err, data) {
                    console.log("GET: /1/members/me/boards");
                    if (err){
                        console.log("Fail: " + err);
                        this.emit('InvalidToken');
                    } else {
                        console.log("Success: " + data);
                        for(var board in data) {
                            this.attributes['UserBoards'][board.name]['id'] = board.id;
                        }
                        this.attributes['Trello'].get("/1/members/me/cards", function(err, data) {
                            console.log("GET: /1/members/me/cards");
                            if (err){
                                console.log("Fail: " + err);
                                this.emit('InvalidToken');
                            } else {
                                console.log("Success: " + data);
                                for(var card in data) {
                                    for(var board in this.attributes['UserBoards']) {
                                        board['id'] = board.id;
                                    }
                                    this.attributes['UserBoards'][board.name]['id'] = board.id;
                                }
                                this.emit('Introduction');
                            };
                        });
                    };
                });
            };
        });
    },
    'Introduction': function() {
        console.log("INTRODUCTION");
        this.handler.state = states.MAINPORTAL;
        this.attributes["speech"] = 'Welcome to Trello for Alexa. What would you like to do?';
        this.attributes["reprompt"] = 'What would you like to do?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    },
    'InvalidToken': function() {
        console.log("INVALIDTOKEN");
        this.attributes["speech"] = 'You token is invalid. Please make sure you linked ' +
                                    'your account. If this problem persists, disable ' +
                                    'then re-enable the skill.';
        this.attributes["reprompt"] = '';
        this.response.speak(this.attributes["speech"]);
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.attributes["speech"] = 'Say yes to continue where you left off, or no to start over.';
        this.attributes["reprompt"] = 'Say yes or no.';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    }
};

const mainPortalHandlers = Alexa.CreateStateHandler(states.MAINPORTAL, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.HelpIntent': function() {
        console.log("HELPINTENT");
        this.attributes["speech"] = 'You can say things like, modify my account, ' +
                                    'open reference, or open my boards. ' +
                                    'You can also say quit to exit at any time. ' +
                                    'What would you like to do?';
        this.attributes["reprompt"] = 'What would you like to do?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    },
    'SwitchToReferenceIntent': function() {
        console.log("SWITCHTOREFERENCEINTENT");
        this.handler.state = states.REFERENCE;
        this.attributes["currentState"] = states.REFERENCE;
        this.attributes["speech"] = 'What would you like to learn?';
        this.attributes["reprompt"] = 'Try asking, what is a card?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    },
    'SwitchToAccountIntent': function() {
        console.log("SWITCHTOACCOUNTINTENT");
        this.handler.state = states.ACCOUNT;
        this.attributes["currentState"] = states.ACCOUNT;
        this.attributes["speech"] = 'What would you like to do regarding your account?';
        this.attributes["reprompt"] = 'Try asking, what are my teams?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    },
    'ContinueIntent': function() {
        console.log("CONTINUEINTENT");
        this.handler.state = this.attributes["currentState"];
        if(this.handler.state == states.MAINPORTAL){
            this.emit('Introuction');
        } else if(this.handler.state == states.REFERENCE){
            this.attributes["speech"] = 'What would you like to learn about?';
            this.attributes["reprompt"] = 'Try asking, what is a card?';
            this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        } else if(this.handler.state == states.ACCOUNT){
            this.attributes["speech"] = 'What would you like to do regarding your account?';
            this.attributes["reprompt"] = 'Try asking, what are my teams?';
            this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        }
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.attributes["speech"] = 'What was that?';
        this.attributes["reprompt"] = 'What was that?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    }
});

const referenceHandlers = Alexa.CreateStateHandler(states.REFERENCE, {
    'NewSession': function () {
        this.emit('NewSession'); // Uses the handler in newSessionHandlers
    },
    'AMAZON.HelpIntent': function() {
        console.log("HELPINTENT");
        this.emit(':responseReady');
        this.attributes["speech"] = 'You can say things like, what is a card, ' +
                                    'what is a list, or what is a board? ' +
                                    'You can also say quit to exit at any time. ' +
                                    'What would you like to learn?';
        this.attributes["reprompt"] = 'What would you like to learn?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    },
    'CardReferenceIntent': function() {
        console.log("CARDREFERENCEINTENT");
        this.attributes["speech"] = 'The fundamental unit of a board is a card. ' + 
                                    'Cards are used to represent tasks and ideas. ' + 
                                    'A card can be something that needs to get done, ' +
                                    'like a blog post to be written, or something ' +
                                    'that needs to be remembered, like company vacation policies. ' + 
                                    'What else would you like to learn?';
        this.attributes["reprompt"] = 'What else would you like to learn?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    },
    'BoardReferenceIntent': function() {
        console.log("BOARDREFERENCEINTENT");
        this.attributes["speech"] = 'A board represents a project or a place to ' + 
                                    'keep track of information. Whether you are ' + 
                                    'launching a new website, or planning a vacation, ' +
                                    'a Trello board is the place to organize your ' +
                                    'tasks and collaborate with your colleagues, family, or friends. ' + 
                                    'What else would you like to learn?';
        this.attributes["reprompt"] = 'What else would you like to learn?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    },
    'ListReferenceIntent': function() {
        console.log("LISTREFERENCEINTENT");
        this.attributes["speech"] = 'Lists keep cards organized in their various stages ' + 
                                    'of progress. They can be used to create a workflow ' + 
                                    'where cards are moved across lists from start to finish, ' +
                                    'or simply act as a place to keep track of ideas and ' +
                                    'information. There’s no limit to the number of lists ' + 
                                    'you can add to a board, and they can be arranged however ' + 
                                    'you like. A basic, but effective, list setup for a ' +
                                    'board might be simply To Do, Doing, and Done, where cards ' +
                                    'start in the To Do list and make their way to the Done list. ' + 
                                    'But don’t forget: Trello is truly customizable to your unique ' +
                                    'needs, so you can name your lists anything you like! Whether ' +
                                    'it\’s basic Kanban, a sales pipeline, a marketing calendar, ' + 
                                    'or project management, what matters most is establishing a ' +
                                    'workflow for the way your team works. ' + 
                                    'What else would you like to learn?';
        this.attributes["reprompt"] = 'What else would you like to learn?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function() {
        console.log("STOPINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function() {
        console.log("CANCELINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'Unhandled': function() {
        console.log("UNHANDLED");
        this.attributes["speech"] = 'What was that?';
        this.attributes["reprompt"] = 'What was that?';
        this.response.speak(this.attributes["speech"]).listen(this.attributes["reprompt"]);
        this.emit(':responseReady');
    }
});
