const Alexa = require('ask-sdk');

const defaultHandlers = require('./src/handlers/defaultHandlers');
const rainHandlers = require('./src/handlers/rainHandlers');

const { IntentReflectorHandler, ErrorHandler, ...handlers } = defaultHandlers;


// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    ...Object.values(handlers),
    ...Object.values(rainHandlers),
    IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(
    ErrorHandler,
  )
  .lambda();
