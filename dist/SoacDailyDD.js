import { createRequire } from "module";
const requires = createRequire(import.meta.url);
const mongoose = requires("mongoose");
const soacDailyDDSchema = new mongoose.Schema({
    _id: String,
    name: String,
    date: String,
    degreeDays: Number,
});
const soacDailyDDModel = mongoose.model("dailyDegreeDays", soacDailyDDSchema, "dailyDegreeDays");
export default soacDailyDDModel;
