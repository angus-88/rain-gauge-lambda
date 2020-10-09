const Alexa = require('ask-sdk');

const dynamoService = require('../dynamoHelper.ts');

const { addRain, getTotalForCurrentMonth } = dynamoService;

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
      console.error(e.message);
      response = e.message;
    }

    return handlerInput.responseBuilder
      .speak(response)
      .getResponse();
  }
};

const GetRainForMonth = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForMonth';
  },
  async handle(handlerInput) {
    const total = await getTotalForCurrentMonth();

    return handlerInput.responseBuilder
      .speak(`This month it has rained ${total} millimeters`)
      .getResponse();
  }
};

module.exports = {
  AddRainHandler,
  GetRainForMonth,
};
