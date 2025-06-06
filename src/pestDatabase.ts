import { SoacDailyDD } from './models/SoacDailyDD.js';
import { SoacYearlyDD } from './models/SoacYearlyDD.js';
import { SoacTotalDD } from './models/SoacTotalDD.js';
import { Pest } from './pest.js';

export class PestDatabase {
  private model_daily: any;
  private model_yearly: any;
  private model_total: any;

  //   constructor(soacDailyDDModel: any, soacYearlyDDModel: any, soacTotalDDModel: any) {
  constructor() {
    this.model_daily = new SoacDailyDD();
    this.model_yearly = new SoacYearlyDD();
    this.model_total = new SoacTotalDD();
  }

  // Add methods to interact with the models as needed

  // Daily Model Methods
  async update_daily(pest_name: string, degree_days: number) {
    try {
      await this.model_daily.update_daily(pest_name, null, degree_days);
    } catch (error) {
      console.error('Error occurred in update_daily:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  async find_daily_range(pest_name: string, start_date: Date, end_date: Date) {
    try {
      return await this.model_daily.find_daily_range(pest_name, start_date, end_date);
    } catch (error) {
      console.error('Error occurred in find_daily_range:', error);
      return []; // Return an empty array on error
    }
  }

  // Yearly Model Methods
  async update_yearly_total_dd(pest_name: string, degree_days: number) {
    try {
      await this.model_yearly.update_yearly_total_dd(pest_name, null, degree_days);
    } catch (error) {
      console.error('Error occurred in update_yearly_total_dd:', error);
      throw error; // Rethrow to handle it in the caller
    }
  }

  async find_yearly(pest_name: string) {
    try {
      return await this.model_yearly.find_yearly(pest_name);
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

  // Total Model Methods
  async find_day_data(start_date: Date, end_date: Date) {
    try {
      return await this.model_total.find_day_data(start_date, end_date);
    } catch (error) {
      console.error('Error occurred in find_day_data:', error);
      return []; // Return an empty array on error
    }
  }

  async zero_out_yearly_data(pest_name: string, start_date: Date) {}

  async data_range_mass_reset(start_date: Date, pests: Record<string, Pest>) {}
}
