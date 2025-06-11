import { Pest } from './pest.js';
import { WeatherStats } from './weatherStats.js';
import { PestDatabase } from './pestDatabase.js';
import { DateTime } from 'luxon';

export class OrchardManager {
  public db: PestDatabase;
  public weather: WeatherStats;
  public pests: Record<string, Pest>;
  public lastUpdate: Date | null = null;

  constructor() {
    // Initialize the PestDatabase with the models
    this.db = new PestDatabase();

    // Initialize the pests and weather stats
    this.weather = new WeatherStats(this.db);
    this.pests = {};

    // Initialize the pests and process data
    this.initialize();
  }


  private async initialize() {
    // Get and create the pests for the current year
    try {
      const collection = await this.db.get_pests_by_year(new Date().getFullYear());
      for (const pestData of collection) {
        const pest = new Pest(
          pestData.name,
          Number(pestData.temp_base ?? 0),
          Number(pestData.temp_max ?? 0),
          this.db,
          pestData.start_date,
          pestData.end_date
        );
        this.pests[pest.name] = pest;
      }
    } catch (error) {
      console.error('Error occurred while fetching pests:', error);
      throw error; // Re-throw to handle it in the caller
    }

    // Process the data for the first time
    try {
      await this.process_data();
    } catch (error) {
      console.error('Error during OrchardManager initialization:', error);
      throw error; // Re-throw to handle it in the caller
    }
  }
  
  day_temp_low() {
    return this.weather.get_low_temp();
  }

  day_temp_high() {
    return this.weather.get_high_temp();
  }

  day_temp_curr() {
    return this.weather.get_curr_temp();
  }

  send_fast_data = (req: any, res: any) => {
    res.status(200).json({
      message: 'Success',
      data: {
        weather: this.weather.toJSON(),
        pests: [...Object.values(this.pests).map((pest) => pest.toJSON())],
      },
    });
  };

  send_processed_data = async (req: any, res: any) => {
    try {
      await this.process_data(); // Process the data
    } catch (error) {
      console.error('Error occurred in send_processed_data:', error);
      return {
        message: 'Error processing data',
        data: null,
      };
    }

    this.send_fast_data(req, res); // Send the fast data response
  };

  async process_data(date: Date = new Date()) {
    try {
      await this.weather.store_weather_data(); // Get weather data
    } catch (error) {
      console.error('Error occurred in process_data for storeWeatherData:', error);
      throw error; // Re-throw to handle it in the caller
    }

    for (const p in this.pests) {
      try {
        this.pests[p].update_daily_temps(this.weather.get_low_temp(), this.weather.get_high_temp());
      } catch (error) {
        console.error(`Error occurred in process_data for update_day_temp for ${p}:`, error);
        throw error; // Re-throw to handle it in the caller
      }

      try {
        await this.pests[p].calculate_daily_degree_days();
      } catch (error) {
        console.error(`Error occurred in process_data for calculate_daily_degree_days for ${p}:`, error);
        throw error; // Re-throw to handle it in the caller
      }

      try {
        await this.pests[p].calculate_running_degree_days();
      } catch (error) {
        console.error(`Error occurred in process_data for calculate_running_degree_days for ${p}:`, error);
        throw error; // Re-throw to handle it in the caller
      }
    }

    this.lastUpdate = new Date(); // Update the last update time
    console.log('Data processed successfully at:', this.lastUpdate);
  }

  /**
   *
   * @param req The request object
   * @param res The response object
   * @returns The response object
   * @description Function to set the new date for the metric
   * @throws Error if there is an error setting the new date
   */
  async set_new_date(req: any, res: any) {
    const name: string = req.body.name as string;
    const new_start_date = req.body.startDate || null;
    const new_end_date = req.body.endDate || null;
    if (!name || !(name in this.pests)) {
      res.status(400).json({ message: 'Invalid metric name' });
    }

    let start = null,
      end = null;
    if (new_start_date != null) {
      start = new Date(new_start_date);
      this.pests[name].update_start_date(start);
    }
    if (new_end_date != null) {
      end = new Date(new_end_date);
      this.pests[name].update_end_date(end);
    }
    try {
      await this.db.update_yearly_dates(name, start, end);
      // res.status(200).json({ message: 'Success' });
    } catch (error) {
      console.error('Error occurred in set_new_date:', error);
      res.status(500).json({ message: 'Error' });
    }

    // update running degree days
    try {
      await this.pests[name].calculate_running_degree_days();
      // res.status(200).json({ message: 'Running degree days updated successfully' });
    } catch (error) {
      console.error('Error occurred while updating running degree days:', error);
      res.status(500).json({ message: 'Error updating running degree days' });
      return;
    }

    // Log the request
    console.log('------------------------------');
    console.log('Change Made');
    console.log('Name:       ' + name);
    if (new_start_date != null) console.log('Start Date: ' + new_start_date);
    if (new_end_date != null) console.log('End Date:   ' + new_end_date);
    console.log('------------------------------');

    res.status(200).json({ message: 'Success' });
  }

  /**
   *
   * @param req The request object
   * @param res The response object
   * @description Function to reset the year data for the metric
   */
  async reset_year_data(req: any, res: any) {
    const year = parseInt(req.body.year, 10);
    const start = DateTime.now();
    // Reset the data
    try {
      // Reset the data for each metric
      try {
        await this.db.delete_daily_all_by_year(year);
        await this.db.zero_out_yearly_data(year);
      } catch (error) {
        console.error(`Error occurred in reset_year_data for zero_out_yearly_data:`, error);
      }

      // Recalculate the daily degree days for each pest based on their respective date ranges
      for (
        const end_index_date = new Date(year, 11, 31), index_date = new Date(year, 0, 1), curr_date = new Date();
        index_date <= (curr_date || end_index_date);
        index_date.setDate(index_date.getDate() + 1)
      ) {
        try {
          await this.weather.store_weather_data(index_date);
        } catch (error) {
          console.error('Error occurred while setting the index date:', error);
        }

        if (this.weather.available_data) {
          for (const name of Object.keys(this.pests)) {
            const pest = this.pests[name];
            const pest_start = pest.get_start_date();
            const pest_end = pest.get_end_date();

            if (index_date >= pest_start && index_date <= pest_end) {
              try {
                pest.update_daily_temps(this.weather.get_low_temp(), this.weather.get_high_temp());
                await pest.calculate_daily_degree_days(index_date);
              } catch (error) {
                console.error('Error occurred while calculating daily degree days:', error);
              }
            }
          }
        }
      }

      // Recalculate the running degree days for each pest
      try {
        const daily_data = await this.db.find_all_daily(year);
        for (const name of Object.keys(this.pests)) {
          this.pests[name].calculate_running_degree_days_data(daily_data);
        }
      } catch (error) {
        console.error('Error occureed while calculating running degree days', error);
      }

      const end = DateTime.now();
      const durationMs = end.toMillis() - start.toMillis();
      console.log(`Total calculation time: ${(durationMs / 1000).toFixed(2)} seconds`);

      // Maybe loop through from begining of year to current day
      // But check if the pest is in range and if now then dont calc for that day for that pest
      // Maybe pass the entire day to each pest to calculate the daily degree days
      // Instead of pulling per pest

      res.status(200).json({ message: 'Success' });
    } catch (error) {
      console.error('Error occurred in reset_year_data:', error);
      res.status(500).json({ message: 'Error occurred in reset_year_data' });
    }
  }
}
