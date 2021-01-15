import * as AWS from 'aws-sdk';
import moment, { Moment } from 'moment';

export const getTotalFromItems = (items: AWS.DynamoDB.DocumentClient.ItemList) => items?.reduce((currentTotal, rainRecord) => currentTotal + rainRecord.amount, 0);

type SpanTotal = {date: Moment, total: number};
export const groupRecordsByTimeSpan = (records: AWS.DynamoDB.DocumentClient.ItemList, timeSpan: 'day' | 'month' | 'year'): SpanTotal[] => {
  const totals: SpanTotal[] = [];
  let currentSpan: Moment | undefined = undefined;
  let spanTotal: number = 0;

  records.forEach((record) => {
    const recordMoment = moment.unix(record.date); 
    // const timeStampMoment = moment(record.timestamp, ['DD/MM/YYYY hh:mm:ss A', 'DD/MM/YYYY HH:mm:ss']);

    
    if (currentSpan && recordMoment.isSame(currentSpan, timeSpan)) {
      spanTotal += record.amount;
    } else {
      // starting a new day/mont
      currentSpan && totals.push({ date: moment(currentSpan), total: spanTotal }); // save prev total

      currentSpan = recordMoment;
      spanTotal = record.amount;
    }
  })

  currentSpan && totals.push({ date: currentSpan, total: spanTotal });
  
  return totals;
}

export const isParseDateError = (parseResult: ParseDateError | ParseDateSuccess): parseResult is ParseDateError => {
  return !!(parseResult as ParseDateError).error 
}
export type ParseDateSuccess = { timeSpan: moment.unitOfTime.StartOf, dateMoment: Moment }
export type ParseDateError = { error: string }
export const parseDateSlot = (requestDate: string): ParseDateSuccess | ParseDateError => {
  const dateMoment = moment();
  let timeSpan: moment.unitOfTime.StartOf = 'year';

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
    } else {
      // NaN
      return {
        error: `Unable to parse date slot: ${requestDate}`,
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
      const weekBeginning = moment(dateMoment).startOf('week').format('Do MMMM YYYY');
      timeSpan = 'week';
    } else {
      // Month
      const month = Number.parseInt(dateParts[1]);
      dateMoment.month(month - 1); // Moment months are indexed from 0, so april = 3

      if (dateMoment.isAfter()) {
        dateMoment.subtract(1, 'year');
      }

      timeSpan = 'month';
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
  }

  return {
    timeSpan,
    dateMoment,
  }
}