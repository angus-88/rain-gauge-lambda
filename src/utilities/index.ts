import AWS from 'aws-sdk';

export const getTotalFromItems = (items: AWS.DynamoDB.DocumentClient.ItemList) => items?.reduce((currentTotal, rainRecord) => currentTotal + rainRecord.amount, 0);
