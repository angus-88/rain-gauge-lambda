import { HandlerInput } from 'ask-sdk';
import { IntentRequest } from 'ask-sdk-model'; 
import moment from 'moment';

import * as Alexa from 'ask-sdk';

import { addRain, getTotalForTimeFrame } from '../dynamoHelper';

const AddRainHandler = {
  canHandle(handlerInput: HandlerInput) {
    console.log(Alexa);
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddRain';
  },
  async handle(handlerInput: HandlerInput) {
    console.log(JSON.stringify(handlerInput, null, 2));
    const request = Alexa.getRequest<IntentRequest>(handlerInput.requestEnvelope);
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

const GetRainForToday = {
  canHandle(handlerInput: HandlerInput) {
    console.log(Alexa);
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForToday';
  },
  async handle(handlerInput: HandlerInput) {
    const today = moment();
    const total = await getTotalForTimeFrame(today, 'day');

    return handlerInput.responseBuilder
      .speak(`Today it has rained ${total} millimetres`)
      .getResponse();
  }
};

const GetRainForMonth = {
  canHandle(handlerInput: HandlerInput) {
    console.log(Alexa);
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForMonth';
  },
  async handle(handlerInput: HandlerInput) {
    const month = moment();
    const total = await getTotalForTimeFrame(month, 'month');

    return handlerInput.responseBuilder
      .speak(`This month it has rained ${total} millimetres`)
      .getResponse();
  }
};


const GetRainForYear = {
  canHandle(handlerInput: HandlerInput) {
    console.log(Alexa);
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForYear';
  },
  async handle(handlerInput: HandlerInput) {
    const today = moment();
    const total = await getTotalForTimeFrame(today, 'year');

    return handlerInput.responseBuilder
      .speak(`The total for this year is ${total} millimetres`)
      .getResponse();
  }
};

module.exports = {
  AddRainHandler,
  GetRainForYear,
  GetRainForMonth,
  GetRainForToday
};
