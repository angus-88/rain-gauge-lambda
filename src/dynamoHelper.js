const moment = require('moment');
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'rain-tally';

const getAllRainRecords = async () => {
  const data = await documentClient.scan({
    TableName: TABLE_NAME,
  }).promise();

  return data;
};

const addRain = async (spokenAmount) => {
  const timestamp = moment().format('DD/MM/YYYY hh:mm:ss A');
  console.log('timestamp: ', timestamp);
  
  const amount = Number.parseInt(spokenAmount, 10);
  console.log('amount: ', amount, typeof amount);

  if (Number.isNaN(amount)) {
    throw new Error('Amount could not be parsed to a number');
  }

  const data = await documentClient.put({
    TableName: TABLE_NAME,
    Item: {
      date: timestamp,
      amount: amount
    }
  }).promise();

  console.log(data);
  return data;
};

module.exports ={
  getAllRainRecords,
  addRain,
};