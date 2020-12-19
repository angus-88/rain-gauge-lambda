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