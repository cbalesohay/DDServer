import { createRequire } from 'module';
const requires = createRequire(import.meta.url);
const mongoose = requires('mongoose');
const soacSchema = new mongoose.Schema({
  _id: String,
  time: String,
  model: String,
  device: Number,
  id: Number,
  batterylow: Number,
  avewindspeed: Number,
  gustwindspeed: Number,
  winddirection: Number,
  cumulativerain: Number,
  temperature: Number,
  humidity: Number,
  light: Number,
  uv: Number,
  mic: String,
  mod: String,
  freq: Number,
  rssi: Number,
  snr: Number,
  noise: Number,
  gateway_id: String,
  source: String,
  total_rainfall: Number,
  label: String,
});
const soacTotalDDModel = mongoose.model('soac', soacSchema, 'weather_rack');
export default soacTotalDDModel;

export class SoacTotalDD {
    private model: typeof soacTotalDDModel;
    constructor() {
      this.model = soacTotalDDModel;
    }
    async find_day_data(start_date_utc: Date, end_date_utc: Date) {
      try {
        const TIMES = { $gte: start_date_utc.toISOString().slice(0, 26), $lt: end_date_utc.toISOString().slice(0, 26) };
    
        // Fetch the data based on the query and projection
        const RESULTS = await this.model.find({ device: 12, id: 148, time: TIMES }).exec();
    
        // If no RESULTS found, throw an error
        if (RESULTS.length === 0) {
          try {
            const RESULTS2 = await this.model.find({ device: 12, id: 171, time: TIMES }).exec();
            if (RESULTS2.length === 0) {
              console.error('No data found for the specified date range.');
            }
            return RESULTS2;
          } catch (error2) {
            console.error('Error occurred in fetch_weather_saoc_data for find:', error2);
            return null;
          }
        }
        return RESULTS;
      } catch (error) {
        console.error('Error occurred in find_day_data:', error);
        return null;
      }
    }
}



