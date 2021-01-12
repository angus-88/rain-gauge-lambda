import { HandlerInput } from 'ask-sdk';
import { IntentRequest } from 'ask-sdk-model'; 
import moment from 'moment';

import * as Alexa from 'ask-sdk';

import { addRain, getTotalForTimeFrame, getWettestTimeSpan } from '../dynamoHelper';
import { getTotalFromItems } from '../utilities';

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

    const dateMoment = moment();
    let timeSpan: moment.unitOfTime.StartOf = 'year';
    let preamble = 'The total so far this year is '

    const dateParts = requestDate?.split('-');
    console.log('dateParts: ', dateParts);
    if (dateParts?.length === 1) {
      const year = Number.parseInt(dateParts[0]);
      /// Year or un recognised
      if (!Number.isNaN(year)) {
        // Year
        dateMoment.year(year);
        console.log(`get total for ${year}`);
        timeSpan = 'year';
        preamble = `the total for ${year} is `
      } else {
         // NaN
        if (dateParts[0] === 'last week') {
          dateMoment.subtract(1, 'week');
          timeSpan = 'week';
          console.log(`get total for last week`);
          preamble = `last week it rained `
        }
      }
    } else if (dateParts?.length === 2) {
      const year = Number.parseInt(dateParts[0]);
      dateMoment.year(year);        

      // Week or Month
      if (dateParts[1].startsWith('W')) {
        // Week
        const weekNumber = Number.parseInt(dateParts[1].slice(1));
        console.log(`week number ${weekNumber}`);

        dateMoment.isoWeek(weekNumber);
        timeSpan = 'week';
        preamble = `in week ${weekNumber} it rained `
      } else {
        // Month
        const month = Number.parseInt(dateParts[1]);
        dateMoment.month(month - 1); // Moment months are indexed from 0, so april = 3

        if (dateMoment.isAfter()) {
          dateMoment.subtract(1, 'year');
        }

        timeSpan = 'month';
        preamble = `the total for ${dateMoment.format('MMMM')} ${dateMoment.year()} is `
        console.log(`get total for ${dateMoment.format('MMMM YYYY')}`);
      }
    } else if (dateParts?.length === 3) {
      // Exact date
      dateMoment.set({ 
        year: Number.parseInt(dateParts[0]),
        month: Number.parseInt(dateParts[1]) -1,
        date: Number.parseInt(dateParts[2]),
      })

      console.log('Parsed Moment: ', dateMoment.toISOString());

      timeSpan = 'day';
      preamble = `the total for ${dateMoment.calendar()} is `
    }

    let response = '';
    try {

      const total = await getTotalForTimeFrame(dateMoment, timeSpan);

      response = `${preamble} ${total}`;
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
  GetWettestTimeSpan,
  GetRainForTimespan,
};

