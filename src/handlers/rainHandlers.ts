import { HandlerInput } from 'ask-sdk';
import { IntentRequest } from 'ask-sdk-model'; 
import moment from 'moment';

import * as Alexa from 'ask-sdk';

import { addRain, getTotalForTimeFrame, getWettestTimeSpan } from '../dynamoHelper';
import { getTotalFromItems, isParseDateError, parseDateSlot } from '../utilities';

// Set First day of week and year to UK standard
moment.updateLocale('en', {
  week : {
      dow : 1,
      doy : 4
   }
});

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

/*
  2020
  last week
  2020-W55
  2020-10
  2020-10-25

*/
const GetRainForTimespan = {
  canHandle(handlerInput: HandlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RainForPreviousTimeSpan';
  },
  async handle(handlerInput: HandlerInput) {
    const request = Alexa.getRequest<IntentRequest>(handlerInput.requestEnvelope);
    const requestDate = request.intent.slots?.date.value;
    console.log('requestDate: ', requestDate);

    let response = '';
    try {
      const result = parseDateSlot(requestDate || '')
      if (isParseDateError(result)) {
        throw new Error(result.error);
      }
      const { dateMoment, timeSpan } = result;
      const now = moment();
      
      const sameYear = now.year() === result.dateMoment.year();
      const sameMonth = now.month() === result.dateMoment.month();
      const sameWeek = now.isoWeek() === result.dateMoment.isoWeek();
      const sameDay = now.dayOfYear() === result.dateMoment.dayOfYear();
      
      let preamble = ''
      switch (result.timeSpan) {
        case 'day':
          if (sameDay) {
            preamble = 'so far today it has rained'; 
          } else {
            preamble = `${dateMoment.calendar()} it rained`
          }
          break;
        case 'week':
          if (sameYear && sameWeek) {
            preamble = 'so far this week it has rained';
          } else {
            preamble = 'last week it rained '
          }
          break;
        case 'month':
          if (sameYear && sameMonth) {
            preamble = 'this month it has rained'
          } else if (sameYear && !sameMonth) {
            preamble = `in ${dateMoment.format('MMMM')} it rained`;
          } else {
            preamble = ` in ${dateMoment.format('MMMM YYYY')} it rained`;
          }
          break;
        case 'year':
          if (sameYear) {
            preamble = 'so far this year it has rained';
          } else {
            preamble = `in ${result.dateMoment.year()} it rained `;
          }
          break;
        default:
          break;
      }

      const total = await getTotalForTimeFrame(result.dateMoment, result.timeSpan);

      response = `${preamble} ${total} millimetres`;
    } catch (e) {
      response = `Sorry there was an error, ${e.message}`;
    }
      
    return handlerInput.responseBuilder
    .speak(response)
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
    const dateSlot = request.intent.slots?.dateRange.value;

    const dateSlotValue = parseDateSlot(dateSlot || '');
    
    if (isParseDateError(dateSlotValue)) {
      console.log(`WettestTimeSpan - ${timespan} on record`)
      const { wettestDate, total } = await getWettestTimeSpan(timespan);

      return handlerInput.responseBuilder
      .speak(`The wettest ${timespan} on record was ${wettestDate} and it rained ${total} millimeters`)
      .reprompt('any other rain questions')
      .getResponse();
    } else {
      const {dateMoment, timeSpan: dateRange} = dateSlotValue;
      if (
        timespan === dateRange || 
        dateRange === 'day' || 
        timespan === 'year' 
      ) {
        return handlerInput.responseBuilder
        .speak(`That makes no sense, I can't find the wettest ${timespan} for a ${dateRange}`)
        .reprompt('any other rain questions')
        .getResponse();  
      }

      console.log(`WettestTimeSpan - ${timespan} in ${dateRange} from ${dateMoment.format('YYYY MMMM')}`);
      const { total, wettestDate, wettestMoment } = await getWettestTimeSpan(timespan, dateMoment, dateRange);

      let outputDateRange = dateMoment.format('YYYY');
      let outputDate = wettestMoment.format('YYYY');
      if (dateRange === 'year') {
        if (dateMoment.year() === moment().year()) {
          outputDateRange = 'this year';
          if (timespan === 'day') {
            outputDate = wettestMoment.format('dddd Do MMMM');
          } else {
            outputDate = wettestMoment.format('MMMM');
          }
        } else {
          outputDateRange = `in ${dateMoment.format('YYYY')}`;
          if (timespan === 'day') {
            outputDate = wettestMoment.format('dddd Do MMMM YYYY');
          } else {
            outputDate = wettestMoment.format('MMMM YYYY');
          }
        }
      } else if (dateRange === 'month') {
        outputDate = wettestMoment.format('dddd Do');
        if (dateMoment.year() === moment().year() && dateMoment.month() === moment().month()) {
          outputDateRange = 'this month'
        } else {
          outputDateRange = `in ${dateMoment.format('MMMM YYYY')}`;
        }
      }
      
      return handlerInput.responseBuilder
      .speak(`The wettest ${timespan} ${outputDateRange} was ${outputDate} and it rained ${total} millimetres`)
      .reprompt('any other rain questions')
      .getResponse();
    }
    
  }
}

module.exports = {
  AddRainHandler,
  GetWettestTimeSpan,
  GetRainForTimespan,
};

