// Total lines of code: 51

// import { createRequire } from 'module';
// const requires = createRequire(import.meta.url);
// const mongoose = requires('mongoose');

// const soacDailyWeatherSchema = new mongoose.Schema(
//   {
//     name: String,
//     date: String,
//     temperature: Number,
//     temperature_high: Number,
//     temperature_low: Number,
//     humidity_avg: Number,
//     rainfall_day: Number,
//     rainfall_total: Number,
//   },
//   { versionKey: false },
// );
// const soacDailyWeatherModel = mongoose.model('daily_weather', soacDailyWeatherSchema, 'daily_weather');
// export default soacDailyWeatherModel;
// export class SoacWeatherDaily {
//   private model: typeof soacDailyWeatherModel;

//   constructor() {
//     this.model = soacDailyWeatherModel;
//   }

//   async find_daily(name: string, date: Date) {
//     try {
//       let doc = { name: name, date: date.toISOString().split('T')[0] };
//       return await this.model.findOne(doc).exec();
//     } catch (error) {
//       console.error('Error occurred in find_daily:', error);
//       return null;
//     }
//   }

//   async insert_daily(name: string, date: Date, weatherData: any): Promise<void> {
//     try {
//       let doc = {
//         name: name,
//         date: date.toISOString().split('T')[0],
//         ...weatherData,
//       };
//       await this.model.create(doc);
//     } catch (error) {
//       console.error('Error occurred in insert_daily:', error);
//     }
//   }
// }