const Alexa = require('ask-sdk');

const { addRain, getTotalForCurrentDay, getTotalForCurrentMonth } = require('../dynamoHelper');

const AddRainHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddRain';
  },
  async handle(handlerInput) {
    console.log(JSON.stringify(handlerInput, null, 2));
    const request = Alexa.getRequest(handlerInput.requestEnvelope);
    const amount = request.intent.slots?.amount.value || '0';
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
      .speak(`This month it has rained ${total} millimetres`)
      .getResponse();
  }
};

const GetRainForToday = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForToday';
  },
  async handle(handlerInput) {
    const total = await getTotalForCurrentDay();

    return handlerInput.responseBuilder
      .speak(`Today it has rained ${total} millimetres`)
      .getResponse();
  }
};

module.exports = {
  AddRainHandler,
  GetRainForMonth,
  GetRainForToday
};
