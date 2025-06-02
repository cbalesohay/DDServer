import { WeatherStats } from './weatherStats.js';
import { DateTime } from 'luxon';

export class DataProcessor {
  constructor(
    private device: number,
    // private Id: number,
    private soac_model_total: any,
    private soac_model_daily: any,
    private soac_model_yearly: any,
  ) {}

  /**
   *
   * @param d The date to convert
   * @returns The converted date in local time
   * @description Function to convert a UTC date to local time
   */
  utc_to_local(d: Date): Date {
    return new Date(d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  }

  /**
   *
   * @param start_date The start date of the data to reset
   * @param metrics The metrics to reset
   * @description Function to reset the data for the given date range
   */
  async data_range_mass_reset(start_date: Date, metrics: Record<string, any>) {
    const today = new Date(); // Current date
    // today.setHours(0, 0, 0, 0); // Set time to midnight

    let current = new Date(start_date); // Current date for the loop
    // current.setHours(0, 0, 0, 0); // Set time to midnight

    const weatherStats = new WeatherStats(); // Create an instance of WeatherStats

    // Might be able to use storePrevDD here
    while (current <= today) {
      const next_day = new Date(current.getTime());
      next_day.setDate(next_day.getDate() + 1);
      next_day.setHours(0, 0, 0, 0); // Set time to midnight

      try {
        await weatherStats.store_weather_data(new Date(current)); // Store the weather data
      } catch (error) {
        console.error('Error occurred in calculateDailyDegreeDays:', error);
        throw error; // Rethrow the error to be handled by the caller
      }

      // Get metric data
      for (const name of Object.keys(metrics)) {
        try {
          metrics[name].update_day_temp_low(weatherStats.get_low_temp());
          metrics[name].update_day_temp_high(weatherStats.get_high_temp());
          await metrics[name].calculate_daily_degree_days(new Date(current));
        } catch (error) {
          console.error(`Error occurred in data_range_mass_reset for calculateDailyDegreeDays for ${name}:`, error);
        }
      }

      current = new Date(current.getTime() + 24 * 60 * 60 * 1000); // Move to the next day
      current.setHours(0, 0, 0, 0); // Set time to midnight
    }
    // Log the request
    console.log('------------------------------');
    console.log('Re-Calculation Made');
    console.log('Year:       ' + start_date.getFullYear());
    console.log('------------------------------');
  }

  /**
   *
   * @param name The name of the metric
   * @param start_date The start date of the data to reset
   * @description Function to reset the data from the given date range
   */
  async zero_out_yearly_data(name: string, start_date: Date) {
    const filter = {
      name: name,
      start_date: {
        $gte: new Date(`${start_date.getFullYear()}-01-01`).toISOString().slice(0, 10),
      },
    };
    try {
      await this.soac_model_daily.deleteMany({ name: name }); // Reset the daily data for this.name
    } catch (error) {
      console.error('Error occurred in zero_out_yearly_data for deleteMany:', error);
    }
    try {
      await this.soac_model_yearly.updateOne(filter, {
        $set: { totalDegreeDays: 0 },
      }); // Update the yearly data for this.name
    } catch (error) {
      console.error('Error occurred in zero_out_yearly_data for updateOne:', error);
    }
  }

  /**
   *
   * @param today The date to fetch data for
   * @returns The fetched data
   * @description Function to fetch the total SAOC data for the given date
   */
  async fetch_weather_saoc_data(today: Date) {
    const { start_utc, end_utc } = this.get_start_and_end_dates(today);

    console.log(
      `Fetching data for UTC: ${start_utc.toISOString().slice(0, 26)} to ${end_utc.toISOString().slice(0, 26)}`,
    );

    const query = {
      device: this.device, // Use the device number from the constructor
      id: 148, // Use the Id from the constructor
      time: {
        $gte: start_utc.toISOString().slice(0, 26),
        $lt: end_utc.toISOString().slice(0, 26),
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
      const results = await this.soac_model_total.find(query, projection).exec();

      // If no results found, throw an error
      if (results.length === 0) {
        query.id = 171; // Change the id to 171 if no results found
        try {
          const results2 = await this.soac_model_total.find(query, projection).exec();
          if (results2.length === 0) {
            console.error('No data found for the specified date range.');
          }
          return results2;
        } catch (error2) {
          console.error('Error occurred in fetch_weather_saoc_data for find:', error2);
        }
      }
      return results;
    } catch (error) {
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  get_start_and_end_dates(today: Date): { start_utc: Date; end_utc: Date } {
    const startLocal = DateTime.fromJSDate(today, { zone: 'America/Los_Angeles' }).startOf('day');
    const nowLocal = DateTime.now().setZone('America/Los_Angeles');

    const isToday = startLocal.hasSame(nowLocal, 'day');
    const endLocal = isToday ? nowLocal : startLocal.plus({ days: 1 });

    const start_utc = startLocal.toUTC().toJSDate();
    const end_utc = endLocal.toUTC().toJSDate();

    return { start_utc, end_utc };
  }
}
