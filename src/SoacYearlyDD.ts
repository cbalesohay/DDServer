import { createRequire } from "module";
const requires = createRequire(import.meta.url);
const mongoose = requires("mongoose");

const soacYearlyDDSchema = new mongoose.Schema({
  _id: String,
  name: String,
  startDate: String,
  endDate: String,
  totalDegreeDays: Number,
  lastInput: String,
});
const soacYearlyDDModel = mongoose.model("yearRunningTotal", soacYearlyDDSchema, "yearRunningTotal");
export default soacYearlyDDModel;
