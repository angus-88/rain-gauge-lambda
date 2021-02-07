import moment, { Moment, unitOfTime } from 'moment';
import * as AWS from 'aws-sdk';
import { getTotalFromItems, groupRecordsByTimeSpan } from './utilities';
const documentClient = new AWS.DynamoDB.DocumentClient();

interface RainEntry {
  year: number;
  date: number;
  amount: number;
  timestamp: string;
}

// Set First day of week and year to UK standard
moment.updateLocale('en', {
  week : {
      dow : 1,
      doy : 4
   }
});

let TABLE_NAME = 'rain-gauge';
if (process.env.RAIN_ENV === 'dev') {
  console.log('Using dev table');
  TABLE_NAME = 'rain-gauge-dev';
} else {
  console.log('Using prod table');
}

export const getAllRainRecords = async (year?: number): Promise<RainEntry[]> => {
  if (year) {
    const data = await documentClient.query({
      TableName: TABLE_NAME,
      KeyConditions: {
        year: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [year]
        }
      }
    }).promise();

    return data.Items as RainEntry[] || [];
  }

  const data = await documentClient.scan({
    TableName: TABLE_NAME,
  }).promise();

  return data.Items as RainEntry[] || [];
};

export const getBetweenMoments = async (begin: Moment, end = moment()): Promise<RainEntry[]> => {
  const data = await documentClient.query({
    TableName: TABLE_NAME,
    KeyConditions: {
      year: {
        ComparisonOperator: 'EQ',
        AttributeValueList: [begin.year()]
      },
      date: {
        ComparisonOperator: 'BETWEEN',
        AttributeValueList: [begin.unix(), end.unix()]
      }
    }
  }).promise();

  console.log(`Found ${data.Count} rain entries between ${begin.toISOString()} and ${end.toISOString()}`);
  
  return data.Items as RainEntry[] || [];
};

export const getTotalForTimeFrame = async (date: Moment, timeFrame: unitOfTime.StartOf) => {
  console.log('Date: ', date.toISOString())
  console.log('timeFrame: ', timeFrame);
  const start = moment(date).startOf(timeFrame);
  const end = moment(date).endOf(timeFrame);

  if (start.isAfter()) {
    throw new Error('I cannot predict the rain');
  }

  const items = await getBetweenMoments(start, end);
  
  const total = getTotalFromItems(items || []);
  
  console.log(`${timeFrame} total: ${total}`);
  return total;
};

export const addRain = async (spokenAmount: string) => {
  const currentTime = moment();
  const timestamp = currentTime.format('DD/MM/YYYY hh:mm:ss A');
  console.log('Adding rain at timestamp: ', timestamp);
  
  const amount = Number.parseInt(spokenAmount, 10);
  console.log('amount: ', amount, typeof amount);

  if (Number.isNaN(amount)) {
    throw new Error('Amount could not be parsed to a number');
  }

  const data = await documentClient.put({
    TableName: TABLE_NAME,
    Item: {
      year: currentTime.year(),
      date: currentTime.unix(),
      timestamp,
      amount: amount
    }
  }).promise();

  console.log(data);
  console.log('Successfully added rain');
  return data;
};

interface GetWettestTimeSpan {
  (timespan: 'year' | 'month' | 'day'): Promise<{ wettestDate: string, total: number, wettestMoment: Moment }>;
  (timespan: 'year' | 'month' | 'day', dateMoment: Moment, dateRange: unitOfTime.StartOf): Promise<{ wettestDate: string, total: number, wettestMoment: Moment}>;
};

export const getWettestTimeSpan: GetWettestTimeSpan = async (timespan: 'year' | 'month' | 'day', dateMoment?: Moment, dateRange?: unitOfTime.StartOf) => {

  let allRain: AWS.DynamoDB.DocumentClient.ItemList | undefined;
  if (dateMoment && dateRange === 'year') {
    allRain = await getAllRainRecords(dateMoment.year()) 
  } else if (dateMoment && dateRange) {
    const startMoment = moment(dateMoment).startOf(dateRange);
    const endMoment = moment(dateMoment).endOf(dateRange);
    allRain = await getBetweenMoments(startMoment, endMoment);
  } else {
    allRain = await getAllRainRecords();
  }


  const totals = groupRecordsByTimeSpan(allRain, timespan);

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
  return { wettestDate, total: totals[0].total, wettestMoment: totals[0].date };
}

if (process.env.DEBUG_RAIN === 'true') {
  // getTotalForTimeFrame(moment(), 'day');
  // getTotalForTimeFrame(moment(), 'month');
  // getTotalForTimeFrame(moment(), 'year');
  console.log(moment.locale());
  const test = async () => {
    const wettestResult = await getWettestTimeSpan('day', moment(), 'year');
      console.log('wettestDate: ', `${wettestResult.wettestDate} with ${wettestResult.total}`);
  }

  test();

}
