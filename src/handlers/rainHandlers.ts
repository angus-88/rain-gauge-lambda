import { HandlerInput } from 'ask-sdk';
import { IntentRequest } from 'ask-sdk-model'; 
import moment from 'moment';

import * as Alexa from 'ask-sdk';

import { addRain, getAllRainRecords, getTotalForTimeFrame, getWettestTimeSpan } from '../dynamoHelper';
import { groupRecordsByTimeSpan } from '../utilities';

const AddRainHandler = {
  canHandle(handlerInput: HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AddRain';
  },
  async handle(handlerInput: HandlerInput) {
    const request = Alexa.getRequest<IntentRequest>(handlerInput.requestEnvelope);
    const amount = request.intent.slots?.amount.value || '0';
    let response = '';
    try {
      await addRain(amount);
      const total = await getTotalForTimeFrame(moment(), 'day');

      response = `Successfully added ${amount} millimeters, the total today is ${total}`;
    } catch (e) {
      console.error(e.message);
      response = e.message;
    }

    return handlerInput.responseBuilder
      .speak(response)
      .getResponse();
  }
};

const GetRainForCurrentTimeSpan = {
  canHandle(handlerInput: HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForTimeSpan';
  },
  async handle(handlerInput: HandlerInput) {
    const today = moment();
    const request = Alexa.getRequest<IntentRequest>(handlerInput.requestEnvelope);
    const timespan = request.intent.slots?.timespan.value as 'year' | 'month' | 'day';
    console.log(`RainForCurrentTimespan - ${timespan}`);

    const total = await getTotalForTimeFrame(today, timespan || 'year');

    return handlerInput.responseBuilder
      .speak(`So far ${timespan.includes('day') ? 'today' : `this ${timespan}`} it has rained ${total} millimetres`)
      .reprompt('any other rain questions')
      .getResponse();
  }
};

const GetRainForPreviousMonth = {
  canHandle(handlerInput: HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForPreviousMonth';
  },
  async handle(handlerInput: HandlerInput) {
    const request = Alexa.getRequest<IntentRequest>(handlerInput.requestEnvelope);
    const month = request.intent.slots?.month.value || moment().subtract(1, 'month').format('MMMM');
    console.log(`RainForPreviousMonth - ${month}`);
    
    const monthMoment = moment().month(month).startOf('month');

    if (monthMoment.isAfter()) {
      monthMoment.subtract(1, 'year');
    }

    console.log('monthMoment: ', monthMoment.toISOString());
    const total = await getTotalForTimeFrame(monthMoment, 'month');

    return handlerInput.responseBuilder
      .speak(`The total in ${month} ${monthMoment.format('YYYY')} was ${total} millimetres`)
      .reprompt('any other rain questions')
      .getResponse();
  }
}

const GetWettestTimeSpan = {
  canHandle(handlerInput: HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WettestTimeSpan';
  },
  async handle(handlerInput: HandlerInput) {
    const request = Alexa.getRequest<IntentRequest>(handlerInput.requestEnvelope);
    const timespan = request.intent.slots?.timespan.value as 'year' | 'month' | 'day';
    console.log(`WettestTimeSpan - ${timespan}`);

    const { wettestDate, total } = await getWettestTimeSpan(timespan);

    return handlerInput.responseBuilder
      .speak(`The wettest ${timespan} was ${wettestDate} and it rained ${total} millimeters`)
      .reprompt('any other rain questions')
      .getResponse();
  }
}

module.exports = {
  AddRainHandler,
  GetRainForCurrentTimeSpan,
  GetRainForPreviousMonth,
  GetWettestTimeSpan,
};

