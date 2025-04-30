const myRequire = createRequire(import.meta.url);
myRequire("dotenv").config();
import { createRequire } from "module";
import soacDailyDDModel from "./SoacDailyDD.js";
import soacYearlyDDModel from "./SoacYearlyDD.js";
import { Metric } from "./metric.js";
import { WeatherStats } from "./weatherStats.js";
const express = myRequire("express");
const bodyParser = myRequire("body-parser");
const MONGODB_URI = process.env.API_KEY;
const MONGODB_URI_DD = process.env.DD_API_KEY;
const mongoose = myRequire("mongoose");
const app = express();
var cors = myRequire("cors");
app.use(cors());
const PORT = process.env.PORT || 4000;
export default app;

type MetricName = ["Western Cherry", "Leaf Rollers", "Codling Moth", "Apple Scab"];
const metricName: MetricName = ["Western Cherry", "Leaf Rollers", "Codling Moth", "Apple Scab"];

interface StoredData {
  metrics: { [name: string]: Metric };
  weather: WeatherStats;
};

let storedData: StoredData = {
  metrics: {
    "Western Cherry": new Metric("Western Cherry", 41),
    "Leaf Rollers": new Metric("Leaf Rollers", 41),
    "Codling Moth": new Metric("Codling Moth", 50),
    "Apple Scab": new Metric("Apple Scab", 32),
  },
  weather: new WeatherStats(),
};

storedData.metrics["Western Cherry"].thresholds?.firstFlight ? 850 : undefined;
storedData.metrics["Leaf Rollers"].maxTemp = 85;
storedData.metrics["Codling Moth"].maxTemp = 88;

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// For reference of connecting two clusters for another day
// https://stackoverflow.com/questions/76358813/how-can-i-connect-two-different-mongodb-clusters-to-my-express-js-backend-using

// Connection to Chris test database
mongoose
  .connect(MONGODB_URI_DD)
  .then(() => console.log("Connected to MongoDB PERSONAL"))
  .catch((err: any) => console.error("MongoDB connection error:", err));

// Connection to SOAC test database
// mongoose
//   .connect(MONGODB_URI)
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err: any) => console.error("MongoDB connection error:", err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on Render port ${PORT}`);
});
// app.post("/post", asyncHandler(getProcessedData)); // Route to fetch and process data
app.post("/sendData", asyncHandler(sendProcessedData)); // Sends most updated data
app.post("/newDate", asyncHandler(setNewDate));
app.get("/health", (req: any, res: any) => {
  res.status(200).send("OK"); // Health check route
});
// Error-handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error occurred:", err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});

/**
 *
 * @param req The request object
 * @param res The response object
 * @param next The next middleware function
 */
async function sendProcessedData(req: any, res: any, next: any) {
  try {
    // Parse request body
    const specificDate = req.body.date;
    const dayAfter = new Date(specificDate);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Fetch and store data
    for (let i = 0; i < metricName.length; i++) {
      await storedData.metrics[metricName[i]].getYearData(soacYearlyDDModel);
      await storedData.metrics[metricName[i]].calculateTotalDegreeDays(soacDailyDDModel);
    }

    // res.json(storedData.metrics); // Respond with processed data
    res.json(storedData); // Respond with processed data

    return 0;
  } catch (error) {
    throw new Error("Error occurred in sendProcessedData");
  }
}

async function setNewDate(req: any, res: any) {
  try {
    const name = req.body.name;
    const newStartDate = req.body.startDate || null;
    const newEndDate = req.body.endDate || null;

    await storedData.metrics[name].storeNewDate(soacYearlyDDModel, newStartDate, newEndDate);

    res.status(200).json({ message: "Success" });

    // Log the request
    console.log("------------------------------");
    console.log("Change Made");
    console.log("Name:       " + name);
    if (newStartDate != null) console.log("Start Date: " + newStartDate);
    if (newEndDate != null) console.log("End Date:   " + newEndDate);
    console.log("------------------------------");

    return 0;
  } catch (error) {
    res.status(400).json({ message: "Error" });
    throw new Error("Error setting new date");
  }
}
