import { WeatherStats } from './weatherStats.js';

export class DataProcessor {
  constructor(
    private device: number,
    // private Id: number,
    private soacTotalDDModel: any,
    private soacDailyDDModel: any,
    private soacYearlyDDModel: any,
  ) {}

  /**
   *
   * @param startDate The start date of the data to reset
   * @param metrics The metrics to reset
   * @description Function to reset the data for the given date range
   */
  async dataRangeMassReset(startDate: Date, metrics: Record<string, any>) {
    const today = new Date(); // Current date
    today.setHours(0, 0, 0, 0); // Set time to midnight

    let current = new Date(startDate); // Current date for the loop
    current.setHours(0, 0, 0, 0); // Set time to midnight

    const weatherStats = new WeatherStats(); // Create an instance of WeatherStats

    // Might be able to use storePrevDD here
    while (current <= today) {
      const nextDay = new Date(current.getTime());
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0); // Set time to midnight

      try {
        await weatherStats.storeWeatherData(new Date(current)); // Store the weather data
      } catch (error) {
        console.error('Error occurred in calculateDailyDegreeDays:', error);
        throw error; // Rethrow the error to be handled by the caller
      }

      // Get metric data
      for (const name of Object.keys(metrics)) {
        try {
          metrics[name].updateTempDayLow(weatherStats.getLowTemp());
          metrics[name].updateTempDayHigh(weatherStats.getHighTemp());
          await metrics[name].calculateDailyDegreeDays(new Date(current));
        } catch (error) {
          console.error(`Error occurred in dataRangeMassReset for calculateDailyDegreeDays for ${name}:`, error);
        }
      }

      current = new Date(current.getTime() + 24 * 60 * 60 * 1000); // Move to the next day
      current.setHours(0, 0, 0, 0); // Set time to midnight
    }
    // Log the request
    console.log('------------------------------');
    console.log('Re-Calculation Made');
    console.log('Year:       ' + startDate.getFullYear());
    console.log('------------------------------');
  }

  /**
   *
   * @param name The name of the metric
   * @param startDate The start date of the data to reset
   * @description Function to reset the data from the given date range
   */
  async zeroOutYearlyData(name: string, startDate: Date) {
    const filter = {
      name: name,
      startDate: {
        $gte: new Date(`${startDate.getFullYear()}-01-01`).toISOString().slice(0, 10),
      },
    };
    try {
      await this.soacDailyDDModel.deleteMany({ name: name }); // Reset the daily data for this.name
    } catch (error) {
      console.error('Error occurred in zeroOutYearlyData for deleteMany:', error);
    }
    try {
      await this.soacYearlyDDModel.updateOne(filter, {
        $set: { totalDegreeDays: 0 },
      }); // Update the yearly data for this.name
    } catch (error) {
      console.error('Error occurred in zeroOutYearlyData for updateOne:', error);
    }
  }

  /**
   *
   * @param today The date to fetch data for
   * @returns The fetched data
   * @description Function to fetch the total SAOC data for the given date
   */
  async fetchWeatherSaocData(today: Date) {
    const startDay = new Date(today);
    startDay.setHours(0, 0, 0, 0); // Set time to midnight
    const nextDay = new Date(startDay);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0); // Set time to midnight
    const query = {
      device: this.device, // Use the device number from the constructor
      id: this.Id, // Use the Id from the constructor
      time: {
        $gte: startDay.toISOString(),
        $lt: nextDay.toISOString(),
      },
    };

    // Specify the fields to return in the projection (rainfall, humidity, temperature)
    const projection = {
      total_rainfall: 1,
      humidity: 1,
      temperature: 1,
      _id: 0, // Exclude the _id field
    };

    try {
      // Fetch the data based on the query and projection
      const results = await this.soacTotalDDModel.find(query, projection).exec();
      
      // If no results found, throw an error
      if (results.length === 0) {
        query.id = 171; // Change the id to 171 if no results found
        try {
          const results2 = await this.soacTotalDDModel.find(query, projection).exec();
          if (results2.length === 0) {
            console.error('No data found for the specified date range.');
          }
          return results2;
        } catch (error2) {
          console.error('Error occurred in fetchWeatherSaocData for find:', error2);
        }
      return results;
    } catch (error) {
      throw error; // Rethrow the error to be handled by the caller
    }
  }
}
