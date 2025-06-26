// Total lines of code: 157

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
  async update_daily(metric_name: string, date: Date, degree_days: number) {
    try {
      await this.model_daily.update_daily(metric_name, date, degree_days);
    } catch (error) {
      console.error('Error occurred in update_daily:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  async find_daily_range(metric_name: string, start_date: Date, end_date: Date) {
    try {
      return await this.model_daily.find_daily_range(metric_name, start_date, end_date);
    } catch (error) {
      console.error('Error occurred in find_daily_range:', error);
      return []; // Return an empty array on error
    }
  }

  async find_all_daily(year: number) {
    try {
      return await this.model_daily.find_all_daily(year);
    } catch (error) {
      console.error('Error occurred in find_all_daily:', error);
      return []; // Return an empty array on error
    }
  }

  async delete_daily_all_by_year(year: number) {
    try {
      await this.model_daily.delete_daily_all_by_year(year);
    } catch (error) {
      console.error('Error occurred in delete_daily_all_by_year:', error);
    }
  }

  async delete_daily(name: string, year: number) {
    try {
      await this.model_daily.delete_daily(name, year);
    } catch (error) {
      console.error('Error occurred in delete_daily_metric:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  // Yearly Model Methods
  async update_yearly_total_dd(metric_name: string, degree_days: number, date: Date) {
    try {
      await this.model_yearly.update_yearly_total_dd(metric_name, degree_days, date);
    } catch (error) {
      console.error('Error occurred in update_yearly_total_dd:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  async update_yearly_dates(metric_name: string, start_date: Date | null, end_date: Date | null) {
    try {
      await this.model_yearly.update_dates(metric_name, start_date, end_date);
    } catch (error) {
      console.error('Error occurred in update_yearly_dates:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  async find_yearly(metric_name: string) {
    try {
      return await this.model_yearly.find_yearly(metric_name);
    } catch (error) {
      console.error('Error occurred in find_yearly:', error);
      return null; // Return null on error
    }
  }

  async find_all_yearly() {
    try {
      return await this.model_yearly.find_all_yearly();
    } catch (error) {
      console.error('Error occurred in find_all_yearly:', error);
      return []; // Return an empty array on error
    }
  }

  async zero_out_yearly_data(year: number) {
    try {
      await this.model_yearly.zero_out_yearly_total_dd(year);
    } catch (error) {
      console.error('Error occurred in zero_out_yearly_data:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  async get_metrics_by_year(year: number) {
    try {
      return await this.model_yearly.get_metrics_by_year(year);
    } catch (error) {
      console.error('Error occurred in get_metrics_by_year:', error);
      return []; // Return an empty array on error
    }
  }

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

  async delete_yearly_metric(name: string, year: number) {
    try {
      await this.model_yearly.delete_yearly_metric(name, year);
    } catch (error) {
      console.error('Error occurred in delete_metric:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  async data_range_mass_reset(start_date: Date, metrics: Record<string, Metric>) {}

  // Total Model Methods
  async find_day_data(start_date: Date, end_date: Date) {
    try {
      return await this.model_total.find_day_data(start_date, end_date);
    } catch (error) {
      console.error('Error occurred in find_day_data:', error);
      return []; // Return an empty array on error
    }
  }
}