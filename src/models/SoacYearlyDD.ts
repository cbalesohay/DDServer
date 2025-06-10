import { createRequire } from 'module';
import { DateTime } from 'luxon';
import { start } from 'repl';
const requires = createRequire(import.meta.url);
const mongoose = requires('mongoose');

const soacYearlyDDSchema = new mongoose.Schema(
  {
    name: String,
    start_date: String,
    end_date: String,
    total_degree_days: Number,
    last_input: String,
  },
  { versionKey: false },
);
const soacYearlyDDModel = mongoose.model('yearly_degree_days', soacYearlyDDSchema, 'yearly_degree_days');
export default soacYearlyDDModel;

export class SoacYearlyDD {
  private model: typeof soacYearlyDDModel;
  constructor() {
    this.model = soacYearlyDDModel;
  }

  async update_yearly_total_dd(name: string, total_dd: number, d?: Date): Promise<void> {
    if (!d) d = new Date();
    const formattedDate = d.toISOString().split('T')[0];

    try {
      await this.model
        .updateOne(
          { name: name },
          { $set: { total_degree_days: total_dd, last_input: formattedDate } },
          { upsert: true },
        )
        .exec();
    } catch (error) {
      console.error('Error occurred in update_yearly_total_dd:', error);
    }
  }

  async update_dates(name: string, start_date: Date | null, end_date: Date | null): Promise<void> {
    interface DateDoc {
      name: string;
      start_date?: string;
      end_date?: string;
    }

    const doc: DateDoc = { name };

    if (!name) {
      console.error('Name must be provided.');
      return;
    }
    if (start_date) doc.start_date = start_date.toISOString().split('T')[0];
    if (end_date) doc.end_date = end_date.toISOString().split('T')[0];

    try {
      await this.model.updateOne({ name: name }, doc, { upsert: true }).exec();
    } catch (error) {
      console.error('Error occurred in update_dates:', error);
    }
  }

  async zero_out_yearly_total_dd(year: number): Promise<void> {
    const date_str = new Date(year, 0, 1).toISOString().split('T')[0];
    try {
      await this.model.updateMany({}, { $set: { total_degree_days: 0, last_input: date_str } }).exec();
    } catch (error) {
      console.error('Error occurred in zero_out_yearly_total_dd:', error);
    }
  }
}
