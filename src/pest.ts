import { PestDatabase } from './pestDatabase.js';

enum DDType {
  DAILY = 'daily',
  YEARLY = 'yearly',
}

/**
 * @description Class to represent a pest
 */
export class Pest {
  public current_year: number;
  public readonly name: string;
  public temp_base: number;
  public max_temp: number;
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

  private db: PestDatabase;

  constructor(name: string, temp_base: number, temp_high: number, init_db: PestDatabase) {
    this.name = name;
    this.temp_base = temp_base;
    this.max_temp = temp_high;

    this.current_year = new Date().getFullYear();

    this.degree_days_date_start = new Date(this.current_year, 0, 1);
    this.degree_days_date_start.setHours(0, 0, 0, 0);

    this.degree_days_date_end = new Date(this.current_year, 11, 31);
    this.degree_days_date_end.setHours(23, 59, 59, 999);

    this.db = init_db;
  }

  /**
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
   *
   * @param dd The degree days to validate
   * @description Function to validate the degree days
   * @returns  true if the degree days are valid, false otherwise
   */
  private validate_degree_days(dd: number): boolean {
    if (dd < 0) return false;
    else return true;
  }

  /**
   *
   * @param dd The degree days to update
   * @param type  The type of degree days to update (daily or yearly)
   * @description Function to update the degree days
   */
  private update_dd_type(dd: number, type: DDType): void {
    this.validate_degree_days(dd);
    if (type === DDType.DAILY) {
      this.degree_days_total += dd - this.degree_days_daily; // Update total with the difference
      this.degree_days_daily = dd; // Update daily degree days
    } else if (type === DDType.YEARLY) {
      this.degree_days_total = dd; // Update total degree days
      try {
        this.db.update_yearly_total_dd(this.name, this.degree_days_total);
      } catch (error) {
        console.error('Error occurred in update_dd_type for update_yearly_total_dd:', error);
        throw error; // Rethrow to handle it in the caller
      }
    }
  }

  /**
   *
   * @param low The low temperature for the day
   * @param high The high temperature for the day
   * @description Function to update the daily temperatures
   */
  update_daily_temps(low: number, high: number) {
    if (!this.validate_temp(low) || !this.validate_temp(high)) {
      throw new Error(`Invalid temperature values: low=${low}, high=${high}`);
    }
    this.day_temp_low = low;
    this.day_temp_high = high > this.max_temp ? this.max_temp : high; // Ensure high does not exceed max_temp
  }

  update_all_values(data: any) {
    if (!data) {
      throw new Error('Data is undefined or null');
    }
    this.degree_days_date_start = data['degree_days_date_start'];
    this.degree_days_date_end = data['degree_days_date_end'];
    this.degree_days_total = data['degree_days_total'];
  }

  /**
   * @description Function to calculate running degree days
   * @returns For testing purposes, returns 0 if successful and -1 if there was an error
   */
  async calculate_running_degree_days() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    const local_date_string = today.toISOString().slice(0, 10);

    try {
      const start = this.degree_days_date_start;
      const end = this.degree_days_date_end;

      if (today < start || today > end) {
        console.warn(
          `Today's date ${local_date_string} is outside the range of ${start.toISOString().slice(0, 10)} to ${end.toISOString().slice(0, 10)}`,
        );
        return; // Exit if today's date is outside the range
      }

      const results = await this.db.find_daily_range(this.name, start, end <= today ? end : today);
      const total_dd = results.reduce((sum: number, r: { degree_days: number }) => sum + r['degree_days'], 0);

      if (total_dd != this.degree_days_total) this.update_dd_type(total_dd, DDType.YEARLY); // Update the total degree days if it has changed
    } catch (error) {
      console.error('Error occurred in calculate_running_degree_days:', error);
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
    if (this.day_temp_low < this.temp_base && this.day_temp_high < this.temp_base) {
      console.warn(
        `Daily temperatures for ${this.name} are out of bounds: Low: ${this.day_temp_low}, High: ${this.day_temp_high}, Base: ${this.temp_base}, Max: ${this.max_temp}`,
      );
      this.update_dd_type(0, DDType.DAILY); // If both temps are below base, set daily DD to 0
      return;
    }

    const daily_dd = Math.max((this.day_temp_low + this.day_temp_high) / 2 - this.temp_base, 0);
    this.update_dd_type(daily_dd, DDType.DAILY); // Update daily degree days
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
