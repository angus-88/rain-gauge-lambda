import moment, { Moment, unitOfTime } from 'moment';
import * as AWS from 'aws-sdk';
import { getTotalFromItems } from './utilities';
const documentClient = new AWS.DynamoDB.DocumentClient();

let TABLE_NAME = 'rain-gauge';
if (process.env.RAIN_ENV === 'dev') {
  console.log('Using dev table');
  TABLE_NAME = 'rain-gauge-dev';
} else {
  console.log('Using prod table');
}

export const getAllRainRecords = async () => {
  const data = await documentClient.scan({
    TableName: TABLE_NAME,
  }).promise();

  return data;
};

export const getBetweenMoments = async (begin: Moment, end = moment()) => {
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

  console.log(`Found ${data.Count} rain entries`);
  console.log(data.Items);
  
  return data.Items;
};


export const getTotalForTimeFrame = async (date: Moment, timeFrame: unitOfTime.StartOf) => {
  console.log(date.format());
  const startOfMonth = moment(date).startOf(timeFrame);
  const endOfMonth = moment(date).endOf(timeFrame);
  const items = await getBetweenMoments(startOfMonth, endOfMonth);
  
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

if (process.env.DEBUG_RAIN === 'true') {
  getTotalForTimeFrame(moment(), 'day');
  getTotalForTimeFrame(moment(), 'month');
  getTotalForTimeFrame(moment(), 'year');
}
