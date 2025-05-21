import { createRequire } from 'module';
const requires = createRequire(import.meta.url);
const mongoose = requires('mongoose');

const soacYearlyDDSchema = new mongoose.Schema(
  {
    name: String,
    startDate: String,
    endDate: String,
    totalDegreeDays: Number,
    lastInput: String,
  },
  { versionKey: false },
);
// const soacYearlyDDModel = mongoose.model('yearRunningTotal', soacYearlyDDSchema, 'yearRunningTotal');
const soacYearlyDDModel = mongoose.model('yearly_degree_days', soacYearlyDDSchema, 'yearly_degree_days');
export default soacYearlyDDModel;
