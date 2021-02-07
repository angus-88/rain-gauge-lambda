import fs from 'fs';
import { getAllRainRecords } from './src/dynamoHelper';

const LOCATION = 'angus/Desktop/rain-gauge-data.csv'
const FILE_PATH = `/mnt/c/Users/${LOCATION}`;

console.log('Downloading all rain records from Dynamo DB');

const awaitDownload = async () => {
  const items = await getAllRainRecords();

  const headers = `year,timestamp,date,amount\n`;

  const csvOutput = items.reduceRight((csvString, rainEntry) => `${csvString}${rainEntry.year},${rainEntry.timestamp},${rainEntry.date},${rainEntry.amount}\n`, headers);

  fs.writeFileSync(FILE_PATH, csvOutput);

  console.log('Download Complete, rain-gauge-data file updated on desktop');
  
}

awaitDownload();
