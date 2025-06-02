import { WeatherStats } from './weatherStats.js';
import soacDailyDDModel from './SoacDailyDD.js';
import soacYearlyDDModel from './SoacYearlyDD.js';
import soacTotalDDModel from './SoacTotalDD.js';
import { start } from 'repl';

/**
 * @description Class to represent a pest
 */
export class Pest {
  public current_year: number;
  public readonly name: string;
  public temp_base: number;
  public max_temp?: number;
  public thresholds?: {
    peakMothFlight?: number;
    firstHatch?: number;
    firstFlight?: number;
    firstApplication?: number;
    firstSpray?: number;
    infectionPhase?: number;
    ddAfterDate?: string;
  };

  private day_temp_low: number = 0;
  private day_temp_high: number = 0;
  private degree_days_curr: number = 0;
  private degree_days_daily: number = 0;
  private degree_days_total: number = 0;
  private degree_days_date_start: Date;
  private degree_days_date_end: Date;

  constructor(name: string, base: number) {
    this.name = name;
    this.temp_base = base;

    this.current_year = new Date().getFullYear();

    this.degree_days_date_start = new Date(this.current_year, 0, 1);
    this.degree_days_date_start.setHours(0, 0, 0, 0);

    this.degree_days_date_end = new Date(this.current_year, 11, 31);
    this.degree_days_date_end.setHours(23, 59, 59, 999);
  }

  update_daily_degree_days(dd: number) {
    this.degree_days_daily = dd;
  }

  update_degree_days_total(dd: number) {
    this.degree_days_total = dd;
  }

  update_degree_days_date_start(date: Date) {
    this.degree_days_date_start = date;
  }

  update_degree_days_date_end(date: Date) {
    this.degree_days_date_end = date;
  }

  update_day_temp_low(temp: number) {
    this.day_temp_low = temp;
  }

  update_day_temp_high(temp: number) {
    this.day_temp_high = temp;
  }

  update_degree_days_curr(dd: number) {
    this.degree_days_curr = dd;
  }

  reset_degree_days_daily() {
    this.degree_days_daily = 0;
  }

  get_degree_days_daily() {
    return this.degree_days_daily;
  }

  get_degree_days_total() {
    return this.degree_days_total;
  }

  get_degree_days_date_start() {
    return this.degree_days_date_start;
  }

  get_degree_days_date_end() {
    return this.degree_days_date_end;
  }

  /**
   * @description Function to get the year data from the database
   * @returns The year data from the database
   */
  async get_year_data() {
    const date_obj = new Date(this.current_year, 0, 1);
    date_obj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formatted_date = date_obj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const filter = {
      name: this.name,
      start_date: {
        $gte: formatted_date,
      },
    };

    try {
      const data = await soacYearlyDDModel.find(filter);
      // if (data.length === 0) throw new Error('No data found');
      if (data.length === 0) this.add_new_yearly_data_point();

      this.update_degree_days_date_start(data[0].start_date);
      this.update_degree_days_date_end(data[0].end_date);
      this.update_degree_days_total(data[0].degree_days_total);
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param name
   * @param change_start
   * @param change_end
   * @returns
   */
  async store_new_date(change_start: Date | null, change_end: Date | null) {
    const date_obj = new Date(this.current_year, 0, 1);
    date_obj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formatted_date = date_obj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const filter = {
      name: this.name,
      start_date: {
        $gte: formatted_date,
      },
    };

    try {
      // Creates doc if does not exist
      const exists = await soacYearlyDDModel.find({ name: this.name });
      if (exists.length === 0) await this.add_new_yearly_data_point();
    } catch (error) {
      throw error;
    }

    if (change_start != null && change_end != null) {
      try {
        await soacYearlyDDModel.updateMany(filter, {
          $set: { start_date: change_start, end_date: change_end },
        });
        this.update_degree_days_date_start(change_start);
        this.update_degree_days_date_end(change_end);
      } catch (error) {
        console.error('Error occurred in store_new_date for updateMany:', error);
      }
    } else if (change_start != null) {
      try {
        await soacYearlyDDModel.updateOne(filter, {
          $set: { start_date: change_start },
        });
        this.update_degree_days_date_start(change_start);
      } catch (error) {
        console.error('Error occurred in store_new_date for updateOne degree_days_date_start:', error);
      }
    } else if (change_end != null) {
      try {
        await soacYearlyDDModel.updateOne(filter, { $set: { end_date: change_end } });
        this.update_degree_days_date_end(change_end);
      } catch (error) {
        console.error('Error occurred in store_new_date for updateOne degree_days_date_end:', error);
      }
    }
    this.calculate_running_degree_days();
  }

  /**
   * @description Function to add a new yearly data point
   */
  async add_new_yearly_data_point() {
    const date_obj = new Date(this.current_year, 0, 1);
    date_obj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formatted_date = date_obj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    try {
      const doc = await soacYearlyDDModel.insertOne({
        name: this.name,
        start_date: this.degree_days_date_start.toISOString().slice(0, 10),
        end_date: this.degree_days_date_end.toISOString().slice(0, 10),
        total_degree_days: this.degree_days_total,
        last_input: formatted_date,
      });
      console.log('Added new Year Data point');
      console.log('Document added: ' + doc);
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param temp_daily_dda The degree day data to store
   * @param date The date to store the data for
   * @description Function to add a new daily data point
   */
  async add_new_daily_data_point(temp_daily_dda: number, date?: Date) {
    const date_obj = date ? new Date(date) : new Date();
    date_obj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formatted_date = date_obj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    try {
      const doc = await soacDailyDDModel.insertOne({
        name: this.name,
        date: formatted_date,
        degree_days: temp_daily_dda,
      });
      console.log('Added new Daily Data point');
      console.log('Document added: ' + doc);
    } catch (error) {
      console.error('Error occurred in add_new_daily_data_point:', error);
      throw error;
    }
  }

  /**
   * @description Function to record degree day data per day
   * @param temp_running_dda The degree day data to store
   */
  async add_dd_to_yearly(temp_running_dda: number, date?: Date) {
    const date_obj = date ? new Date(date) : new Date();
    date_obj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formatted_date = date_obj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    try {
      // Creates doc if does not exist
      const exists = await soacYearlyDDModel.find({ name: this.name });
      if (exists.length === 0) await this.add_new_yearly_data_point();
    } catch (error) {
      console.error('Error occurred in add_dd_to_yearly for existing data:', error);
    }

    // Push the new degree day data to the database
    try {
      await soacYearlyDDModel.updateOne(
        {
          name: this.name,
          start_date: {
            $gte: new Date(`${this.current_year}-01-01`).toISOString().slice(0, 10),
          },
        },
        {
          $set: {
            total_degree_days: temp_running_dda,
            last_input: formatted_date,
          },
        },
      );
    } catch (error) {
      console.error('Error occurred in add_dd_to_yearly for updateOne:', error);
    }
  }

  /**
   *
   * @param name The name of the pest
   * @param temp_daily_dda The degree day data to store
   */
  async add_dd_to_daily(name: string, temp_daily_dda: number, date?: Date) {
    const date_obj = date ? new Date(date) : new Date();
    date_obj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formatted_date = date_obj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const daily_input = {
      name: name,
      date: formatted_date,
      degree_days: temp_daily_dda,
    };
    // try {
    //   // Creates doc if does not exist
    //   const exists = await soacDailyDDModel.find(daily_input);
    //   if (exists.length === 0) await this.add_new_daily_data_point(temp_daily_dda, date);
    //   else if (exists[0].degree_days < temp_daily_dda) {
    //     try {
    //       await soacDailyDDModel.updateOne(daily_input, { $set: { degree_days: temp_daily_dda } });
    //     } catch (error) {
    //       console.error('Error occurred in add_dd_to_daily for updateOne:', error);
    //     }
    //   }
    //   this.update_degree_days_curr(exists[0].degree_days);
    // } catch (error) {
    //   console.error('Error occurred in add_dd_to_daily for find:', error);
    //   throw error;
    // }

    try {
      const exists = await soacDailyDDModel.find(daily_input);
      let final_dd = temp_daily_dda;

      if (exists.length === 0) {
        await this.add_new_daily_data_point(temp_daily_dda, date);
      } else {
        const existing_dd = exists[0].degree_days;
        if (existing_dd < temp_daily_dda) {
          await soacDailyDDModel.updateOne(daily_input, { $set: { degree_days: temp_daily_dda } });
        } else {
          final_dd = existing_dd;
        }
      }

      this.update_degree_days_curr(final_dd);
    } catch (error) {
      console.error('Error occurred in add_dd_to_daily:', error);
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  /**
   * @description Function to store the previous days data
   */
  async store_prev_dd() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    const prev_day = today.setDate(today.getDate() - 1);

    let prev_total = -1;

    // Filter model for specific date
    const date_string = new Date(prev_day).toISOString().slice(0, 10);
    const filter = {
      name: this.name,
      date: { $gte: date_string },
    };

    try {
      // Get the data from the database
      const daily_data = await soacDailyDDModel.find(filter).exec();
      if (daily_data.length === 0) throw new Error('No data found');

      // calculate previous total
      prev_total = 0;
      for (let i = 0; i < daily_data.length; i++) {
        prev_total += daily_data[i].degree_days;
      }
    } catch (error) {
      throw error;
    }

    // Store and update the total seasonal data
    if (prev_total === -1) {
      console.error('Error occurred in store_prev_dd: No data found');
      throw new Error('Error occurred in totaling previous data');
    } else {
      // Store the data in the database
      const date_string = new Date(this.current_year, 0, 1).toISOString().slice(0, 10);
      const filter = {
        name: this.name,
        degree_days_date_start: {
          $gte: date_string,
        },
      };

      try {
        const yearly_data = await soacYearlyDDModel.find(filter);
        if (yearly_data.length === 0) throw new Error('No data found');

        try {
          // Update the data in the database
          yearly_data.updateOne({
            name: this.name,
            total_degree_days: prev_total, //////////////////////////////////////////
          });
        } catch (error) {
          console.error('Error occurred in store_prev_dd for updateOne:', error);
        }
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   * @description Function to calculate running degree days
   * @returns For testing purposes, returns 0 if successful and -1 if there was an error
   */
  async calculate_running_degree_days() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    const local_date_string =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    let found_today = false;
    let temp_degree_days_total = 0;

    if (!this.degree_days_date_start || !this.degree_days_date_end) {
      throw new Error(
        `Start or end date is undefined in calculate_running_degree_days. Start: ${this.degree_days_date_start}, End: ${this.degree_days_date_end}`,
      );
    }

    let temp_start_date = this.degree_days_date_start.toString().slice(0, 10);
    let temp_end_date = this.degree_days_date_end.toString().slice(0, 10);

    // Get Daily data here
    // const filter = {
    //   name: this.name,
    //   date: {
    //     $gte: this.degree_days_date_start,
    //     $lte: today < this.degree_days_date_end ? today : this.degree_days_date_end,
    //   },
    // };

    const filter = {
      name: this.name,
      date: {
        $gte: temp_start_date,
        $lte: today < this.degree_days_date_end ? local_date_string : temp_end_date,
      },
    };

    try {
      const daily_data = await soacDailyDDModel.find(filter).exec();
      // if (daily_data.length === 0) throw new Error('No data found');

      if (daily_data.length !== 0) {
        // Tally total degree days
        for (let i = 0; i < daily_data.length; i++) {
          temp_degree_days_total += daily_data[i].degree_days;

          // Fix the if. It is defaulting to reset
          // if (daily_data[i].date == today) {
          if (daily_data[i].date == local_date_string) {
            this.update_daily_degree_days(daily_data[i].degree_days);
            // await this.calculate_daily_degree_days(new Date(daily_data[i].date));
            found_today = true;
          }
        }

        if (!found_today) this.reset_degree_days_daily();

        if (this.degree_days_total !== temp_degree_days_total) {
          try {
            // Store the data
            this.update_degree_days_total(temp_degree_days_total);
            await this.add_dd_to_yearly(temp_degree_days_total); // Assign temp_running_dda to the degree_days_total
          } catch (error) {
            console.error('Error occurred in calculate_running_degree_days for add_dd_to_yearly:', error);
          }
        }

      }
    } catch (error) {
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  /**
   *
   * @description Function to calculate the daily degree days
   *  (Low + High)
   *  ------------  - Base Temp
   *       2
   */
  async calculate_daily_degree_days(date?: Date) {
    // Pull new weather data
    const normalized_date = date ? new Date(date) : new Date(); // Use passed date or current date
    normalized_date.setHours(0, 0, 0, 0); // Normalize to local midnight
    normalized_date.toISOString().slice(0, 10);

    this.update_daily_degree_days(Math.max((this.day_temp_low + this.day_temp_high) / 2 - this.temp_base, 0));
    if (this.degree_days_daily > 0) {
      try {
        await this.add_dd_to_daily(this.name, this.degree_days_daily, date); // Add to daily DD
      } catch (error) {
        console.error('Error occurred in calculate_daily_degree_days for add_dd_to_daily:', error);
      }

      try {
        await this.add_dd_to_yearly(this.degree_days_daily, date); // Add to running DD total
      } catch (error) {
        console.error('Error occurred in calculate_daily_degree_days for add_dd_to_yearly:', error);
      }
    }
  }

  /**
   *
   * @returns relevant data
   */
  toJSON() {
    return {
      name: this.name,
      temp_base: this.temp_base,
      max_temp: this.max_temp,
      thresholds: this.thresholds,
      current_year: this.current_year,
      degree_days_daily: this.degree_days_daily,
      degree_days_total: this.degree_days_total,
      degree_days_date_start: this.degree_days_date_start,
      degree_days_date_end: this.degree_days_date_end,
    };
  }
}
