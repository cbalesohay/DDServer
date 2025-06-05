const myRequire = createRequire(import.meta.url);
myRequire('dotenv').config();
import { createRequire } from 'module';
import soacDailyDDModel from './SoacDailyDD.js';
import soacYearlyDDModel from './SoacYearlyDD.js';
import soacTotalDDModel from './SoacTotalDD.js';
import { WeatherStats } from './weatherStats.js';
import { createMetricData, MetricName, metric_names, StoredData } from './createMetricData.js';
import { DataProcessor } from './dataProcessor.js';
const express = myRequire('express');
const bodyParser = myRequire('body-parser');
const MONGODB_URI = process.env.API_KEY;
const mongoose = myRequire('mongoose');
const app = express();
var cors = myRequire('cors');
app.use(cors());
const PORT = process.env.PORT || 4000;
export default app;

let storedData: StoredData = {
  pests: createMetricData(),
  weather: new WeatherStats(),
};

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

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
app.get('/sendData', asyncHandler(send_processed_data)); // Sends most updated data
app.post('/newDate', asyncHandler(set_new_date)); // Sets new date for the metric
app.post('/reCalcData', asyncHandler(reset_year_data)); // Resets the year data for the metric
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
// async function send_processed_data(req: any, res: any) {
async function send_processed_data(req: any, res: any) {
  try {
    await storedData.weather.store_weather_data(); // Get weather data
  } catch (error) {
    console.error('Error occurred in send_processed_data for storeWeatherData:', error);
  }

  // Get metric data
  for (const name of metric_names) {
    try {
      await storedData.pests[name].get_year_data();
    } catch (error) {
      console.error(`Error occurred in send_processed_data for get_year_data for ${name}:`, error);
    }

    try {
      storedData.pests[name].update_day_temp_low(storedData.weather.get_low_temp());
      storedData.pests[name].update_day_temp_high(storedData.weather.get_high_temp());
      await storedData.pests[name].calculate_daily_degree_days();
      await storedData.pests[name].calculate_running_degree_days();
    } catch (error) {
      console.error(`Error occurred in send_processed_data for calculate_running_degree_days for ${name}:`, error);
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
async function set_new_date(req: any, res: any) {
  try {
    const name: MetricName = req.body.name as MetricName;
    const new_start_date = req.body.startDate || null;
    const new_end_date = req.body.endDate || null;
    if (!name || !metric_names.includes(name)) {
      return res.status(400).json({ message: 'Invalid metric name' });
    }

    await storedData.pests[name].store_new_date(new_start_date, new_end_date);
    res.status(200).json({ message: 'Success' });

    // Log the request
    console.log('------------------------------');
    console.log('Change Made');
    console.log('Name:       ' + name);
    if (new_start_date != null) console.log('Start Date: ' + new_start_date);
    if (new_end_date != null) console.log('End Date:   ' + new_end_date);
    console.log('------------------------------');
  } catch (error) {
    console.error('Error occurred in set_new_date:', error);
    res.status(500).json({ message: 'Error' });
  }
}

// Call this fucntion every 24 hours at 12:05 am
// for (const name of metric_names) {
//   await storedData.pests[name].storePrevDD(soacDailyDDModel, soacYearlyDDModel);
// }

/**
 *
 * @param req The request object
 * @param res The response object
 * @description Function to reset the year data for the metric
 */
async function reset_year_data(req: any, res: any) {
  const year = parseInt(req.body.year, 10);
  const startDate = new Date(year, 0, 1); // January 1st of the specified year
  startDate.setHours(0, 0, 0, 0); // Set time to midnight

  // Reset the data
  try {
    // Instantiate the DataProcessor class
    const dataProcessor = new DataProcessor(12, soacTotalDDModel, soacDailyDDModel, soacYearlyDDModel);

    // Reset the data for each metric
    for (const name of metric_names) {
      try {
        await dataProcessor.zero_out_yearly_data(storedData.pests[name].name, startDate);
      } catch (error) {
        console.error(`Error occurred in reset_year_data for zero_out_yearly_data for ${name}:`, error);
      }
      storedData.pests[name].reset_degree_days_daily();
    }

    // Reset the data for the specified date range & recalculate
    try {
      await dataProcessor.data_range_mass_reset(startDate, storedData.pests);
    } catch (error) {
      console.error('Error occurred in reset_year_data for dataRangeMassReset:', error);
    }

    for (const name of metric_names) {
      try {
        await storedData.pests[name].get_year_data();
      } catch (error) {
        console.error(`Error occurred in reset_year_data for calculate_running_degree_days for ${name}:`, error);
      }
      try {
        await storedData.pests[name].calculate_running_degree_days();
      } catch (error) {
        console.error(`Error occurred in reset_year_data for calculate_running_degree_days for ${name}:`, error);
      }
    }
    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error('Error occurred in reset_year_data:', error);
    res.status(500).json({ message: 'Error occurred in reset_year_data' });
  }
}
