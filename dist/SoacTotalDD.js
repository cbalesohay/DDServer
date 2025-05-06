import { createRequire } from "module";
const requires = createRequire(import.meta.url);
const mongoose = requires("mongoose");
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
const soacTotalDDModel = mongoose.model("soac", soacSchema, "weather_rack");
export default soacTotalDDModel;
