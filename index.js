const AWS = require("aws-sdk");
const Alexa = require('ask-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

// const defaultHanlders = require('./defaultHandlers');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome, you can say Hello or Help. Which would you like to try?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const getAllRainRecords = async () => {
    try {
        const data = await documentClient.scan({
            TableName: 'rain-tally',
        }).promise();
        return {
            statusCode: 200,
            body: {isError: false, data },
        };
    } catch (e) {
        return {
            statusCode: 500,
            body: { isError: true, errorMessage: e.message },
        };
    }
};

// exports.handler = async (event) => {
//     console.log(event);
//     switch (event.type) {
//         case 'getAll':
//             return await getAllRainRecords();
//         default:
//             return {
//                 statusCode: 404,
//                 body: { isError: true, errorMessage: `No handler found for ${event.type}` },
//             };
//     }
// };

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        // HelloWorldIntentHandler,
        // HelpIntentHandler,
        // CancelAndStopIntentHandler,
        // SessionEndedRequestHandler,
        // IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    // .addErrorHandlers(
    //     ErrorHandler,
    // )
    .lambda();
