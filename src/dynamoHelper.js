const moment = require('moment');
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

let TABLE_NAME = 'rain-tally';
if (process.env.RAIN_ENV === 'dev') {
  console.log('Using dev table');
  TABLE_NAME = 'rain-tally-dev';
} else {
  console.log('Using prod table');
}

const getAllRainRecords = async () => {
  const data = await documentClient.scan({
    TableName: TABLE_NAME,
  }).promise();

  return data;
};

const addRain = async (spokenAmount) => {
  const currentTime = moment();
  const timestamp = currentTime.format('DD/MM/YYYY hh:mm:ss A');
  console.log('timestamp: ', timestamp);
  
  const amount = Number.parseInt(spokenAmount, 10);
  console.log('amount: ', amount, typeof amount);

  if (Number.isNaN(amount)) {
    throw new Error('Amount could not be parsed to a number');
  }

  const data = await documentClient.put({
    TableName: TABLE_NAME,
    Item: {
      date: currentTime.unix(),
      timestamp,
      amount: amount
    }
  }).promise();

  console.log(data);
  console.log('Successfully added rain');
  return data;
};

module.exports ={
  getAllRainRecords,
  addRain,
};