import { createRequire } from 'module';
const requires = createRequire(import.meta.url);
const mongoose = requires('mongoose');

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

  async find_daily(name: string, date: Date) {
    try {
      let doc = { name: name, date: date.toISOString().split('T')[0] };
      return await this.model.findOne(doc).exec();
    } catch (error) {
      console.error('Error occurred in find_daily:', error);
      return null;
    }
  }

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

  async insert_daily(name: string, date: Date, dd: number): Promise<void> {
    try {
      let doc = { name: name, date: date.toISOString().split('T')[0], degree_days: dd };
      await this.model.create(doc);
    } catch (error) {
      console.error('Error occurred in insert_daily:', error);
    }
  }

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

  async delete_daily(name: string): Promise<void> {
    try {
      await this.model.deleteMany({ name: name }).exec();
    } catch (error) {
      console.error('Error occurred in delete_daily:', error);
    }
  }

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
