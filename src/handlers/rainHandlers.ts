import { HandlerInput } from 'ask-sdk';
import { IntentRequest } from 'ask-sdk-model'; 
import moment from 'moment';

import * as Alexa from 'ask-sdk';

import { addRain, getAllRainRecords, getTotalForTimeFrame } from '../dynamoHelper';
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
      .speak(`${timespan.includes('day') ? 'Today' : `This ${timespan}`} it has rained ${total} millimetres`)
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

    const allRain = await getAllRainRecords();

    const totals = groupRecordsByTimeSpan(allRain.Items || [], timespan); 
    
    totals.sort((first, second) => second.total - first.total);
    console.log('totals: ', totals);
    let format = 'dddd Do MMMM YYYY';
    switch (timespan) {
      case 'day':
        format = 'dddd Do MMMM YYYY';
        break;
      case 'month':
        format = 'MMMM YYYY';
        break;
      case 'year':
        format = 'YYYY';
        break;
      default:
        format = 'dddd Do MMMM YYYY';
        break;
    }
    const wettestDate = totals[0].date.format(format);

    return handlerInput.responseBuilder
      .speak(`The wettest ${timespan} was ${wettestDate} and it rained ${totals[0].total} millimeters`)
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
