// Total lines of code: 248
import { SoacDailyDD } from './models/SoacDailyDD.js';
import { SoacYearlyDD } from './models/SoacYearlyDD.js';
import { SoacTotalDD } from './models/SoacTotalDD.js';
import { Metric } from './metric.js';

export class MetricDatabase {
  private model_daily: any;
  private model_yearly: any;
  private model_total: any;

  constructor() {
    this.model_daily = new SoacDailyDD();
    this.model_yearly = new SoacYearlyDD();
    this.model_total = new SoacTotalDD();
  }

  // Daily Model Methods
  /**
   * @description Updates the daily degree days for a given metric and date.
   * 
   * @param metric_name The name of the metric to update
   * @param date The date for which to update the daily metric
   * @param degree_days The degree days to update for the metric
   */
  async update_daily(metric_name: string, date: Date, degree_days: number) {
    try {
      await this.model_daily.update_daily(metric_name, date, degree_days);
    } catch (error) {
      console.error('Error occurred in update_daily:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  /**
   * @description Finds daily degree days for a given metric within a specified date range.
   * 
   * @param metric_name The name of the metric to find
   * @param start_date The start date for the range
   * @param end_date The end date for the range
   * @returns The daily degree days for the specified metric within the date range.
   */
  async find_daily_range(metric_name: string, start_date: Date, end_date: Date) {
    try {
      return await this.model_daily.find_daily_range(metric_name, start_date, end_date);
    } catch (error) {
      console.error('Error occurred in find_daily_range:', error);
      return []; // Return an empty array on error
    }
  }

  /**
   * @description Finds all daily metrics for a given year.
   * 
   * @param year The year for which to find all daily metrics
   * @returns The daily metrics for the specified year.
   */
  async find_all_daily(year: number) {
    try {
      return await this.model_daily.find_all_daily(year);
    } catch (error) {
      console.error('Error occurred in find_all_daily:', error);
      return []; // Return an empty array on error
    }
  }

  /**
   * @description Deletes all daily metrics for a given year.
   * 
   * @param year The year for which to delete all daily metrics
   */
  async delete_daily_all_by_year(year: number) {
    try {
      await this.model_daily.delete_daily_all_by_year(year);
    } catch (error) {
      console.error('Error occurred in delete_daily_all_by_year:', error);
    }
  }

  /**
   * @description Deletes a specific daily metric by name and year.
   * 
   * @param name The name of the metric to delete
   * @param year The year for which to delete the daily metric
   */
  async delete_daily(name: string, year: number) {
    try {
      await this.model_daily.delete_daily(name, year);
    } catch (error) {
      console.error('Error occurred in delete_daily_metric:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  // Yearly Model Methods
  /**
   * @description Updates the yearly total degree days for a given metric and date.
   * 
   * @param metric_name The name of the metric to update
   * @param degree_days The degree days to update for the metric
   * @param date The date for which to update the yearly metric
   */
  async update_yearly_total_dd(metric_name: string, degree_days: number, date: Date) {
    try {
      await this.model_yearly.update_yearly_total_dd(metric_name, degree_days, date);
    } catch (error) {
      console.error('Error occurred in update_yearly_total_dd:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  /**
   * @description Updates the start and end dates for a given yearly metric.
   * 
   * @param metric_name The name of the metric to update
   * @param start_date The start date for the metric
   * @param end_date The end date for the metric
   */
  async update_yearly_dates(metric_name: string, start_date: Date | null, end_date: Date | null) {
    try {
      await this.model_yearly.update_dates(metric_name, start_date, end_date);
    } catch (error) {
      console.error('Error occurred in update_yearly_dates:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  /**
   * @description Finds the yearly degree days for a given metric.
   * 
   * @param metric_name The name of the metric to find
   * @returns The yearly degree days for the specified metric.
   */
  async find_yearly(metric_name: string) {
    try {
      return await this.model_yearly.find_yearly(metric_name);
    } catch (error) {
      console.error('Error occurred in find_yearly:', error);
      return null; // Return null on error
    }
  }

  /**
   * @description Finds all yearly metrics stored in the database.
   * 
   * @returns All yearly metrics.
   */
  async find_all_yearly() {
    try {
      return await this.model_yearly.find_all_yearly();
    } catch (error) {
      console.error('Error occurred in find_all_yearly:', error);
      return []; // Return an empty array on error
    }
  }

  /**
   * @description Resets the total degree days for a given year to zero.
   * 
   * @param year The year for which to zero out the yearly data
   */
  async zero_out_yearly_data(year: number) {
    try {
      await this.model_yearly.zero_out_yearly_total_dd(year);
    } catch (error) {
      console.error('Error occurred in zero_out_yearly_data:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  /**
   * @description Retrieves all metrics for a given year.
   * 
   * @param year The year for which to get metrics
   * @returns The metrics for the specified year.
   */
  async get_metrics_by_year(year: number) {
    try {
      return await this.model_yearly.get_metrics_by_year(year);
    } catch (error) {
      console.error('Error occurred in get_metrics_by_year:', error);
      return []; // Return an empty array on error
    }
  }

  /**
   * @description Adds a new metric to the yearly metrics database.
   * 
   * @param data The data to add a new metric
   */
  async add_metric(data: {
    name: string;
    type: string;
    start_date: Date | null;
    end_date: Date | null;
    total_degree_days: number;
    active_year: number;
    temp_base: number;
    temp_max: number;
  }) {
    try {
      await this.model_yearly.add_metric(data);
    } catch (error) {
      console.error('Error occurred in add_metric:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  /**
   * @description Deletes a specific yearly metric by name and year.
   * 
   * @param name The name of the metric to delete
   * @param year The year for which to delete the yearly metric
   */
  async delete_yearly_metric(name: string, year: number) {
    try {
      await this.model_yearly.delete_yearly_metric(name, year);
    } catch (error) {
      console.error('Error occurred in delete_metric:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  /**
   * @description Resets the degree days for all metrics within a specified date range.
   * 
   * @param start_date The start date for the mass reset
   * @param metrics The metrics to reset
   */
  async data_range_mass_reset(start_date: Date, metrics: Record<string, Metric>) {}

  // Total Model Methods
  /**
   * @description Finds daily data for a specified date range.
   * 
   * @param start_date The start date for the data retrieval
   * @param end_date The end date for the data retrieval
   * @returns The daily data for the specified date range.
   */
  async find_day_data(start_date: Date, end_date: Date) {
    try {
      return await this.model_total.find_day_data(start_date, end_date);
    } catch (error) {
      console.error('Error occurred in find_day_data:', error);
      return []; // Return an empty array on error
    }
  }
}