import Alexa, { getRequest } from 'ask-sdk';
import { IntentRequest } from 'ask-sdk-model';

import { addRain, getTotalForCurrentMonth } from '../dynamoHelper';

const AddRainHandler = {
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddRain';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    console.log(JSON.stringify(handlerInput, null, 2));
    const request = getRequest<IntentRequest>(handlerInput.requestEnvelope);
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
  canHandle(handlerInput: Alexa.HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForMonth';
  },
  async handle(handlerInput: Alexa.HandlerInput) {
    const total = await getTotalForCurrentMonth();

    return handlerInput.responseBuilder
      .speak(`This month it has rained ${total} millimetres`)
      .getResponse();
  }
};

module.exports = {
  AddRainHandler,
  GetRainForMonth,
}
