// Total lines of code: 256
import { MetricDatabase } from './metricDatabase.js';

enum DDType {
  DAILY = 'daily',
  YEARLY = 'yearly',
}

/**
 * @description Class to represent a Metric
 */
export class Metric {
  public current_year: number;
  public readonly name: string;
  public type: string;
  public temp_base: number;
  public temp_max: number;
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
  private degree_days_daily: number = 0;
  private degree_days_total: number = 0;
  private degree_days_date_start: Date;
  private degree_days_date_end: Date;

  private db: MetricDatabase;

  constructor(
    name: string,
    type: string,
    temp_base: number,
    temp_max: number,
    init_db: MetricDatabase,
    start_date: Date,
    end_date: Date,
  ) {
    this.name = name; // Set name of metric
    this.type = type; // Set type of metric
    this.temp_base = temp_base; // Set base temperature
    this.temp_max = temp_max; // Set maximum temperature

    this.current_year = new Date().getFullYear(); // Set current year

    this.degree_days_date_start = new Date(start_date); // Set to start of the day
    this.degree_days_date_start.setHours(0, 0, 0, 0); // Ensure start of the day

    this.degree_days_date_end = new Date(end_date); // Set to end of the day
    this.degree_days_date_end.setHours(23, 59, 59, 999); // Ensure end date is set to the end of the day

    this.db = init_db; // Initialize the database connection
  }

  /**
   * @description Function to validate the temperature
   *
   * @param temp The temperature to validate
   * @description Function to validate the temperature
   * @returns  true if the temperature is valid, false otherwise
   */
  private validate_temp(temp: number): boolean {
    if (temp < -100 || temp > 150) return false;
    else return true;
  }

  /**
   * @description Function to validate the degree days
   *
   * @param dd The degree days to validate
   * @returns  true if the degree days are valid, false otherwise
   */
  private validate_degree_days(dd: number): boolean {
    if (dd < 0) return false;
    else return true;
  }

  /**
   * @description Function to update the degree days
   *
   * @param dd The degree days to update
   * @param type  The type of degree days to update (daily or yearly)
   */
  private async update_dd_type(dd: number, type: DDType, date: Date = new Date()): Promise<void> {
    this.validate_degree_days(dd);
    if (type === DDType.DAILY) {
      this.degree_days_total += dd - this.degree_days_daily; // Update total with the difference
      this.degree_days_daily = dd; // Update daily degree days
      try {
        await this.db.update_daily(this.name, date, this.degree_days_daily);
      } catch (error) {
        console.error('Error occurred in update_dd_type for update_daily:', error);
        throw error; // Rethrow to handle it in the caller
      }
    } else if (type === DDType.YEARLY) {
      this.degree_days_total = dd; // Update total degree days
      try {
        await this.db.update_yearly_total_dd(this.name, this.degree_days_total, date);
      } catch (error) {
        console.error('Error occurred in update_dd_type for update_yearly_total_dd:', error);
        throw error; // Rethrow to handle it in the caller
      }
    }
  }

  /**
   * @description Function to get the start date of the degree days
   * 
   * @returns The start date of the degree days
   */
  get_start_date() {
    return this.degree_days_date_start;
  }

  /**
   * @description Function to get the end date of the degree days
   * 
   * @returns The end date of the degree days
   */
  get_end_date() {
    return this.degree_days_date_end;
  }

  /**
   * @description Function to update the start date of the degree days
   * 
   * @param date The date to update the start or end date
   */
  update_start_date(date: Date) {
    this.degree_days_date_start = date;
  }

  /**
   * @description Function to update the end date of the degree days
   * 
   * @param date The date to update the end date
   */
  update_end_date(date: Date) {
    this.degree_days_date_end = date;
  }

  /**
   * @description Function to update the daily temperatures
   *
   * @param low The low temperature for the day
   * @param high The high temperature for the day
   */
  update_daily_temps(low: number, high: number) {
    if (!this.validate_temp(low) || !this.validate_temp(high)) {
      throw new Error(`Invalid temperature values: low=${low}, high=${high}`);
    }
    this.day_temp_low = low;
    this.day_temp_high = high > this.temp_max ? this.temp_max : high; // Ensure high does not exceed max_temp
  }

  /**
   * @description Function to calculate running degree days
   * 
   * @returns For testing purposes, returns 0 if successful and -1 if there was an error
   */
  async calculate_running_degree_days() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight

    try {
      const start = this.degree_days_date_start;
      const end = this.degree_days_date_end;

      if (start > today) return; // No calculation needed for future ranges

      const cappedEnd = end <= today ? end : today;
      const results = await this.db.find_daily_range(this.name, start, cappedEnd);

      const total_dd = results.reduce((sum: number, r: { degree_days?: number }) => sum + (r.degree_days ?? 0), 0);

      if (total_dd !== this.degree_days_total) {
        await this.update_dd_type(total_dd, DDType.YEARLY);
      }
    } catch (error) {
      console.error('Error occurred in calculate_running_degree_days:', error);
      throw error;
    }
  }

  /**
   * @description Function to calculate the total degree days from the provided data
   * 
   * @param data The data to calculate running degree days from
   * @returns This function calculates the total degree days from the provided data
   */
  async calculate_running_degree_days_data(data: any) {
    if (!data) {
      console.error('No data provided for calculate_running_degree_days_data');
      return;
    }

    const filtered_data = data.filter((d: any) => d.name === this.name);
    const total_dd = filtered_data.reduce((sum: number, r: { degree_days: number }) => sum + r['degree_days'], 0);
    console.log(`Total degree days for ${this.name} from data: ${total_dd}`);
    try {
      if (total_dd != this.degree_days_total) await this.update_dd_type(total_dd, DDType.YEARLY); // Update the total degree days if it has changed
    } catch (error) {
      console.error('Error occurred in calculate_running_degree_days_data:', error);
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
  async calculate_daily_degree_days(date: Date = new Date()) {
    try {
      if (this.day_temp_low < this.temp_base && this.day_temp_high < this.temp_base) {
        console.warn(
          `Daily temperatures for ${this.name} are out of bounds: Low: ${this.day_temp_low}, High: ${this.day_temp_high}, Base: ${this.temp_base}, Max: ${this.temp_max}`,
        );
        await this.update_dd_type(0, DDType.DAILY, date); // If both temps are below base, set daily DD to 0
        return;
      }

      const daily_dd = Math.max((this.day_temp_low + this.day_temp_high) / 2 - this.temp_base, 0);
      await this.update_dd_type(daily_dd, DDType.DAILY, date); // Update daily degree days
    } catch (error) {}
  }

  /**
   * @description Function to convert the metric to JSON format
   *
   * @returns relevant data
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      temp_base: this.temp_base,
      temp_max: this.temp_max,
      thresholds: this.thresholds,
      current_year: this.current_year,
      degree_days_daily: this.degree_days_daily,
      degree_days_total: this.degree_days_total,
      degree_days_date_start: this.degree_days_date_start,
      degree_days_date_end: this.degree_days_date_end,
    };
  }
}