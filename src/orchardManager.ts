import { Pest } from './pest.js';
import { WeatherStats } from './weatherStats.js';
import { PestDatabase } from './pestDatabase.js';

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
    this.pests = {
      'Western Cherry': new Pest('Western Cherry', 41, 149, this.db),
      'Leaf Rollers': new Pest('Leaf Rollers', 41, 85, this.db),
      'Codling Moth': new Pest('Codling Moth', 50, 88, this.db),
      'Apple Scab': new Pest('Apple Scab', 32, 149, this.db),
    };

    // Initialize the pests with their respective optional parameters
    this.pests['Western Cherry'].thresholds = this.pests['Western Cherry'].thresholds || {};
    this.pests['Western Cherry'].thresholds.firstFlight = 850;

    this.initialize();
  }

  private async initialize() {
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
    try {
      await this.db.update_yearly_dates(name, new_start_date, new_end_date);
      res.status(200).json({ message: 'Success' });
    } catch (error) {
        console.error('Error occurred in set_new_date:', error);
        res.status(500).json({ message: 'Error' });
    }
    
    // Log the request
    console.log('------------------------------');
    console.log('Change Made');
    console.log('Name:       ' + name);
    if (new_start_date != null) console.log('Start Date: ' + new_start_date);
    if (new_end_date != null) console.log('End Date:   ' + new_end_date);
    console.log('------------------------------');
  }

  /**
   *
   * @param req The request object
   * @param res The response object
   * @description Function to reset the year data for the metric
   */
  async reset_year_data(req: any, res: any) {
    const year = parseInt(req.body.year, 10);
    const startDate = new Date(year, 0, 1); // January 1st of the specified year
    startDate.setHours(0, 0, 0, 0); // Set time to midnight

    // Reset the data
    try {
      // Reset the data for each metric
      try {
        await this.db.zero_out_yearly_data(year);
      } catch (error) {
        console.error(`Error occurred in reset_year_data for zero_out_yearly_data:`, error);
      }

      // Maybe loop through from begining of year to current day
      // But check if the pest is in range and if now then dont calc for that day for that pest
      // Maybe pass the entire day to each pest to calculate the daily degree days
      // Instead of pulling per pest

      //   // Reset the data for the specified date range & recalculate
      //   try {
      //     await this.db.data_range_mass_reset(startDate, this.pests);
      //   } catch (error) {
      //     console.error('Error occurred in reset_year_data for dataRangeMassReset:', error);
      //   }

      //   for (const name of Object.keys(this.pests)) {
      //     try {
      //     } catch (error) {
      //       console.error(`Error occurred in reset_year_data for calculate_running_degree_days for ${name}:`, error);
      //     }
      //     try {
      //       await this.pests[name].calculate_running_degree_days();
      //     } catch (error) {
      //       console.error(`Error occurred in reset_year_data for calculate_running_degree_days for ${name}:`, error);
      //     }
      //   }
      res.status(200).json({ message: 'Success' });
    } catch (error) {
      console.error('Error occurred in reset_year_data:', error);
      res.status(500).json({ message: 'Error occurred in reset_year_data' });
    }
  }
}
