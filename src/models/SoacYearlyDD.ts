// Total lines of code: 176
import { createRequire } from 'module';
const requires = createRequire(import.meta.url);
const mongoose = requires('mongoose');

const soacYearlyDDSchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    start_date: String,
    end_date: String,
    total_degree_days: Number,
    last_input: String,
    active_year: Number,
    temp_base: Number,
    temp_max: Number,
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

  /**
   * @description This function updates the yearly total degree days for a given metric and date.
   * 
   * @param name The name of the metric to find
   * @param total_dd The total degree days to update for the metric
   * @param d The date for which to update the yearly total degree days
   */
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

  /**
   * @description This function updates the start and end dates for a given metric.
   * 
   * @param name The name of the metric to update
   * @param start_date The start date for the metric
   * @param end_date The end date for the metric
   */
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

  /**
   * @description This function sets the total degree days to zero for all metrics in a given
   * 
   * @param year The year for which to zero out the total degree days
   */
  async zero_out_yearly_total_dd(year: number): Promise<void> {
    const date_str = new Date(year, 0, 1).toISOString().split('T')[0];
    try {
      await this.model.updateMany({}, { $set: { total_degree_days: 0, last_input: date_str } }).exec();
    } catch (error) {
      console.error('Error occurred in zero_out_yearly_total_dd:', error);
    }
  }

  /**
   * @description Retrieves all metrics for a given year.
   * 
   * @param year The year for which to get the metrics
   * @returns The metrics for the specified year.
   */
  async get_metrics_by_year(year: number) {
    try {
      return await this.model.find({ active_year: year });
    } catch (error) {
      console.error('Error occurred in get_metric_by_year:', error);
      return []; // Return an empty array on error
    }
  }

  /**
   * @description Finds the yearly degree days for a given metric.
   * 
   * @param data The data to find the yearly degree days for
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
  }): Promise<void> {
    const { name, type, start_date, end_date, total_degree_days, active_year, temp_base, temp_max } = data;

    if (!name) {
      console.error('Name must be provided.');
      return;
    }

    const current_year = new Date().getFullYear();

    const doc = {
      name,
      type,
      start_date: start_date
        ? start_date.toISOString().split('T')[0]
        : new Date(current_year, 0, 1).toISOString().split('T')[0],
      end_date: end_date
        ? end_date.toISOString().split('T')[0]
        : new Date(current_year, 11, 31).toISOString().split('T')[0],
      total_degree_days,
      active_year,
      temp_base,
      temp_max,
    };

    try {
      await this.model.create(doc);
    } catch (error) {
      console.error('Error occurred in add_metric:', error);
    }
  }

  /**
   * @description Deletes a yearly metric by name and year.
   * 
   * @param name The name of the metric to delete
   * @param year The year for which to delete the metric
   */
  async delete_yearly_metric(name: string, year: number): Promise<void> {
    if (!name || !year) {
      console.error('Name and year must be provided.');
      return;
    }

    try {
      await this.model.deleteOne({ name: name, active_year: year });
    } catch (error) {
      console.error('Error occurred in delete_metric:', error);
    }
  }
}