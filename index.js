const Alexa = require('ask-sdk');

const defaultHandlers = require('./src/defaultHandlers');
const dynamoService = require('./src/dynamoHelper');

const { IntentReflectorHandler, ErrorHandler, ...handlers } = defaultHandlers;

const { addRain } = dynamoService;

const AddRainHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddRain';
  },
  async handle(handlerInput) {
    console.log(JSON.stringify(handlerInput, null, 2));
    const amount = handlerInput.requestEnvelope.request.intent.slots.amount.value;
    let response = '';
    try {

      await addRain(amount);
      response = `Successfully added ${amount} to the rain gauge`;
    } catch (e) {
      response = e.message;
    }

    return handlerInput.responseBuilder
      .speak(response)
      .getResponse();
  }
};



// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    ...Object.values(handlers),
    AddRainHandler,
    IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  )
  .addErrorHandlers(
    ErrorHandler,
  )
  .lambda();
