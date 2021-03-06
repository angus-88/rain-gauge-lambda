import fs from 'fs';
import moment from 'moment';
import { getAllRainRecords } from './src/dynamoHelper';

const LOCATION = 'angus/OneDrive/Desktop/rain-gauge-data.csv'
const FILE_PATH = `/mnt/c/Users/${LOCATION}`;

console.log('Collecting latest rain records from DynamoDB');

const awaitDownload = async (existingData: string, date?: number) => {
  const items = await getAllRainRecords(date);
  items.sort((a, b) => a.date - b.date);

  console.log(`Adding ${items.length} records`);
  const csvOutput = items.reduce((csvString, rainEntry) => `${csvString}${rainEntry.year},${rainEntry.timestamp},${rainEntry.date},${rainEntry.amount}\n`, existingData);
  
  fs.writeFileSync(FILE_PATH, csvOutput);
  
  console.log('Download Complete, rain-gauge-data file updated on desktop');
  
}

// Start script
const headers = `year,timestamp,date,amount\n`;
try {
  const existingData = fs.readFileSync(FILE_PATH, 'utf-8');
  const existingRows = existingData.split('\n');
  
  let mostRecentRecord: string[] = [];
  
  for (let index = existingRows.length -1; index > 0; index--) {
    const record = existingRows[index].trim();
  
    if (record.trim()) {
      mostRecentRecord = record.split(',');
      break;
    }
    
  }
  
  const [year, timestamp, date] = mostRecentRecord;
  const from = Number.parseInt(date);
  if (Number.isNaN(from) || !moment.unix(from).isValid()) {
    console.log(`Record invalid, starting again - ${year},${timestamp},${date}`);
    awaitDownload(headers);
  } else {
    console.log(`Downloading date after - ${timestamp}`);
    awaitDownload(existingData, from);
  }
} catch (e) {
  // no existing file, start again
  console.log('File not found, downloading all data');
  awaitDownload(headers);
}




