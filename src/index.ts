const myRequire = createRequire(import.meta.url);
myRequire('dotenv').config();
import { createRequire } from 'module';
import soacDailyDDModel from './SoacDailyDD.js';
import soacYearlyDDModel from './SoacYearlyDD.js';
import soacTotalDDModel from './SoacTotalDD.js';
import { WeatherStats } from './weatherStats.js';
import { createMetricData } from './createMetricData.js';
import { MetricName } from './createMetricData.js';
import { metricNames } from './createMetricData.js';
import { StoredData } from './createMetricData.js';
import { DataProcessor } from './dataProcessor.js';
const express = myRequire('express');
const bodyParser = myRequire('body-parser');
const MONGODB_URI = process.env.API_KEY;
const MONGODB_URI_DD = process.env.DD_API_KEY;
const mongoose = myRequire('mongoose');
const app = express();
var cors = myRequire('cors');
app.use(cors());
const PORT = process.env.PORT || 4000;
export default app;

let storedData: StoredData = {
  metrics: createMetricData(),
  weather: new WeatherStats(),
};

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// For reference of connecting two clusters for another day
// https://stackoverflow.com/questions/76358813/how-can-i-connect-two-different-mongodb-clusters-to-my-express-js-backend-using

// Connection to Chris test database
// mongoose
//   .connect(MONGODB_URI_DD)
//   .then(() => console.log('Connected to MongoDB PERSONAL'))
//   .catch((err: any) => console.error('MongoDB connection error:', err));

// Connection to SOAC test database
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to SOAC MongoDB'))
  .catch((err: any) => console.error('MongoDB connection error:', err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on EC2 port ${PORT}`);
});
app.get('/sendData', asyncHandler(sendProcessedData)); // Sends most updated data
app.post('/newDate', asyncHandler(setNewDate)); // Sets new date for the metric
app.post('/reCalcData', asyncHandler(resetYearData)); // Resets the year data for the metric
app.get('/health', (req: any, res: any) => {
  res.status(200).send('OK'); // Health check route
});
// Error-handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error occurred:', err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

/**
 *
 * @param req The request object
 * @param res The response object
 * @returns The response object
 * @description Function to get the processed data
 * @throws Error if there is an error getting the processed data
 */
// async function sendProcessedData(req: any, res: any) {
async function sendProcessedData(req: any, res: any) {
  try {
    await storedData.weather.storeWeatherData(); // Get weather data
  } catch (error) {
    console.error('Error occurred in sendProcessedData for storeWeatherData:', error);
  }

  // Get metric data
  for (const name of metricNames) {
    try {
      await storedData.metrics[name].getYearData();
    } catch (error) {
      console.error(`Error occurred in sendProcessedData for getYearData for ${name}:`, error);
    }

    try {
      storedData.metrics[name].updateTempDayLow(storedData.weather.getLowTemp());
      storedData.metrics[name].updateTempDayHigh(storedData.weather.getHighTemp());
      await storedData.metrics[name].calculateRunningDegreeDays();
    } catch (error) {
      console.error(`Error occurred in sendProcessedData for calculateRunningDegreeDays for ${name}:`, error);
    }
  }

  res.status(200).json({
    message: 'Success',
    data: storedData,
  });
}

/**
 *
 * @param req The request object
 * @param res The response object
 * @returns The response object
 * @description Function to set the new date for the metric
 * @throws Error if there is an error setting the new date
 */
async function setNewDate(req: any, res: any) {
  try {
    const name: MetricName = req.body.name as MetricName;
    const newStartDate = req.body.startDate || null;
    newStartDate.setHours(0, 0, 0, 0); // Set time to midnight
    const newEndDate = req.body.endDate || null;
    newEndDate.setHours(0, 0, 0, 0); // Set time to midnight

    await storedData.metrics[name].storeNewDate(newStartDate, newEndDate);
    res.status(200).json({ message: 'Success' });

    // Log the request
    console.log('------------------------------');
    console.log('Change Made');
    console.log('Name:       ' + name);
    if (newStartDate != null) console.log('Start Date: ' + newStartDate);
    if (newEndDate != null) console.log('End Date:   ' + newEndDate);
    console.log('------------------------------');
  } catch (error) {
    console.error('Error occurred in setNewDate:', error);
    res.status(500).json({ message: 'Error' });
  }
}

// Call this fucntion every 24 hours at 12:05 am
// for (const name of metricNames) {
//   await storedData.metrics[name].storePrevDD(soacDailyDDModel, soacYearlyDDModel);
// }

/**
 *
 * @param req The request object
 * @param res The response object
 * @description Function to reset the year data for the metric
 */
async function resetYearData(req: any, res: any) {
  const year = parseInt(req.body.year, 10);
  const startDate = new Date(year, 0, 1); // January 1st of the specified year
  startDate.setHours(0, 0, 0, 0); // Set time to midnight

  // Reset the data
  try {
    // Instantiate the DataProcessor class
    const dataProcessor = new DataProcessor(12, 171, soacTotalDDModel, soacDailyDDModel, soacYearlyDDModel);

    // Reset the data for each metric
    for (const name of metricNames) {
      try {
        await dataProcessor.zeroOutYearlyData(storedData.metrics[name].name, startDate);
      } catch (error) {
        console.error(`Error occurred in resetYearData for zeroOutYearlyData for ${name}:`, error);
      }
      storedData.metrics[name].resetDailyDegreeDays();
    }

    // Reset the data for the specified date range & recalculate
    try {
      await dataProcessor.dataRangeMassReset(startDate, storedData.metrics);
    } catch (error) {
      console.error('Error occurred in resetYearData for dataRangeMassReset:', error);
    }

    for (const name of metricNames) {
      try {
        await storedData.metrics[name].getYearData();
      } catch (error) {
        console.error(`Error occurred in resetYearData for calculateRunningDegreeDays for ${name}:`, error);
      }
      try {
        await storedData.metrics[name].calculateRunningDegreeDays();
      } catch (error) {
        console.error(`Error occurred in resetYearData for calculateRunningDegreeDays for ${name}:`, error);
      }
    }
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('Error occurred in resetYearData:', error);
    res.status(500).json({ message: 'Error occurred in resetYearData' });
  }
}
