// Total lines of code: 216
import { createRequire } from 'module';
const requires = createRequire(import.meta.url);
const mongoose = requires('mongoose');

/**
 * @description This schema defines the structure for daily degree days in the SOAC database.
 */
const soacDailyDDSchema = new mongoose.Schema(
  {
    name: String,
    date: String,
    degree_days: Number,
  },
  { versionKey: false },
);
const soacDailyDDModel = mongoose.model('daily_degree_days', soacDailyDDSchema, 'daily_degree_days');
export default soacDailyDDModel;

export class SoacDailyDD {
  private model: typeof soacDailyDDModel;
  constructor() {
    this.model = soacDailyDDModel;
  }

  /**
   * @description This function finds the daily degree days for a given metric and date.
   * 
   * @param name The name of the metric to find
   * @param date The date for which to find the daily degree days
   * @returns The daily degree days for the specified metric and date, or null if not found.
   */
  async find_daily(name: string, date: Date) {
    try {
      let doc = { name: name, date: date.toISOString().split('T')[0] };
      return await this.model.findOne(doc).exec();
    } catch (error) {
      console.error('Error occurred in find_daily:', error);
      return null;
    }
  }

  /**
   * @description This function finds the daily degree days for a given metric within a specified date range.
   * 
   * @param name The name of the metric to find
   * @param start_date The start date for the range
   * @param end_date The end date for the range
   * @returns The daily degree days for the specified metric within the date range, or an empty array if not found.
   */
  async find_daily_range(name: string, start_date: Date, end_date: Date) {
    try {
      let doc = {
        name: name,
        date: {
          $gte: start_date.toISOString().split('T')[0],
          $lte: end_date.toISOString().split('T')[0],
        },
      };
      return await this.model.find(doc).exec();
    } catch (error) {
      console.error('Error occurred in find_daily_range:', error);
      return [];
    }
  }

  /**
   * @description This function finds all daily degree days for a given year.
   * 
   * @param year The year for which to find all daily degree days
   * @returns The daily degree days for the specified year, or an empty array if not found.
   */
  async find_all_daily(year: number) {
    try {
      let start_date = new Date(year, 0, 1);
      start_date.setHours(0, 0, 0, 0);
      let end_date = new Date(year, 11, 31);
      end_date.setHours(23, 59, 59, 999);
      let doc = {
        date: {
          $gte: start_date.toISOString().split('T')[0],
          $lte: end_date.toISOString().split('T')[0],
        },
      };
      return await this.model.find(doc).exec();
    } catch (error) {
      console.error('Error occurred in find_all_daily:', error);
      return [];
    }
  }

  /**
   * @description This function inserts daily degree days for a given metric and date.
   * 
   * @param name The name of the metric to insert
   * @param date The date for which to insert the daily degree days
   * @param dd The degree days to insert for the metric
   */
  async insert_daily(name: string, date: Date, dd: number): Promise<void> {
    try {
      let doc = { name: name, date: date.toISOString().split('T')[0], degree_days: dd };
      await this.model.create(doc);
    } catch (error) {
      console.error('Error occurred in insert_daily:', error);
    }
  }

  /**
   * @description This function updates the daily degree days for a given metric and date.
   * 
   * @param name The name of the metric to update
   * @param date The date for which to update the daily degree days
   * @param dd The degree days to update for the metric
   */
  async update_daily(name: string, date: Date, dd: number): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    const filter = { name, date: dateStr };

    try {
      const result = await this.model.updateOne(filter, { $set: { degree_days: dd } }).exec();

      if (result.matchedCount === 0) {
        // No document found, so insert new one
        await this.insert_daily(name, date, dd);
      }
    } catch (error) {
      console.error('Error occurred in update_daily:', error);
    }
  }

  /**
   * @description This function deletes all daily degree days for a given metric and year.
   * 
   * @param name The name of the metric to delete
   * @param year The year for which to delete the daily degree days
   * @returns This function deletes all daily degree days for a given metric and year.
   */
  async delete_daily(name: string, year: number): Promise<void> {
    if (!name || !year) {
      console.error('Name and year must be provided.');
      return;
    }
    const start_date_str = `${year}-01-01`;
    const end_date_str = `${year}-12-31`;
    const doc = {
      name: name,
      date: {
        $gte: start_date_str,
        $lte: end_date_str,
      },
    };
    try {
      await this.model.deleteMany(doc).exec();
    } catch (error) {
      console.error('Error occurred in delete_daily:', error);
    }
  }

  /**
   * @description This function deletes all daily degree days for a given year.
   * 
   * @param year The year for which to delete all daily degree days
   */
  async delete_daily_all_by_year(year: number): Promise<void> {
    const start_date_str = `${year}-01-01`;

    const end_date_str = `${year}-12-31`;

    const doc = {
      date: {
        $gte: start_date_str,
        $lte: end_date_str,
      },
    };

    try {
      await this.model.deleteMany(doc).exec();
    } catch (error) {
      console.error('Error occurred in delete_daily:', error);
    }
  }

  /**
   * @description This function adds degree days to the daily degree days for a given metric and date.
   * 
   * @param name The name of the metric to add degree days to
   * @param date The date for which to add degree days
   * @param dd The degree days to add for the metric
   * @returns The total degree days added for the metric on the specified date.
   */
  async add_dd_to_daily(name: string, date: Date = new Date(), dd: number): Promise<number> {
    try {
      let existing = await this.find_daily(name, date);
      let existing_dd: number = existing['degree_days'] ?? 0;
      if (existing === null) {
        try {
          await this.insert_daily(name, date, dd);
        } catch (error) {
          console.error('Error occurred in insert_daily in add_dd_to_daily:', error);
        }
        return dd;
      } else if (existing['degree_days'] < dd) {
        let delta = dd - existing_dd;
        try {
          await this.update_daily(name, date, dd);
        } catch (error) {
          console.error('Error occurred in update_daily in add_dd_to_daily:', error);
        }
        return delta;
      }
    } catch (error) {
      console.error('Error occurred in add_dd_to_daily:', error);
    }
    return 0; // No change needed
  }
}