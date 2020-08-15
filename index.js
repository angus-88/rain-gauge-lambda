const AWS = require('aws-sdk');
const Alexa = require('ask-sdk');

const defaultHandlers = require('./src/defaultHandlers');

const documentClient = new AWS.DynamoDB.DocumentClient();


const { IntentReflectorHandler, ErrorHandler, ...handlers } = defaultHandlers;
console.log(typeof handlers, handlers);
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


// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        ...Object.values(handlers),
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();
