import { createRequire } from 'module';
const requires = createRequire(import.meta.url);
const mongoose = requires('mongoose');
const soacDailyDDSchema = new mongoose.Schema({
    name: String,
    date: String,
    degreeDays: Number,
}, { versionKey: false });
// const soacDailyDDModel = mongoose.model('dailyDegreeDays', soacDailyDDSchema, 'dailyDegreeDays');
const soacDailyDDModel = mongoose.model('daily_degree_days', soacDailyDDSchema, 'daily_degree_days');
export default soacDailyDDModel;
