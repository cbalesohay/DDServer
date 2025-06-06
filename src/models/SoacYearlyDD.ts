import { createRequire } from 'module';
import { DateTime } from 'luxon';
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

  async update_yearly_total_dd(name: string, total_dd: number, d: string): Promise<void> {
    if (d == null) d = DateTime.now().toISODate().slice(0, 3);

    try {
      await this.model.updateOne({ name: name }, { $set: { total_degree_days: total_dd, last_input: d } }).exec();
    } catch (error) {
      console.error('Error occurred in update_yearly_total_dd:', error);
    }
  }

  async update_dates(name: string, start_date: Date, end_date: Date): Promise<void> {}

  async zero_out_yearly_total_dd(year: number): Promise<void> {
    try {
      await this.model.updateMany({}, { $set: { total_degree_days: 0, last_input: new Date(year, 0, 1) } }).exec();
    } catch (error) {
      console.error('Error occurred in zero_out_yearly_total_dd:', error);
    }
  }
}
