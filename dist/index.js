const myRequire = createRequire(import.meta.url);
myRequire("dotenv").config();
import { createRequire } from "module";
import soacModel from "./Soac.js";
const express = myRequire("express");
const bodyParser = myRequire("body-parser");
const MONGODB_URI = process.env.API_KEY;
const mongoose = myRequire("mongoose");
const app = express();
var cors = myRequire("cors");
app.use(cors());
const PORT = process.env.PORT || 4000;
export default app;
// Don't think I need this
const degreeDayType = {
    "Western Cherry": {
        baseTemp: 41,
        ddAfterDate: "05-01",
        firstFlight: 950, // degree days after March 1st
        firstApplication: 1060, // on or before 1060 degree days
    },
    "Leaf Rollers": {
        baseTemp: 41,
        maxTemp: 85,
        peakMothFlight: 0, // 220 -250 degree days
        firstHatch: 420, // degree days
    },
    "Codling Moth": {
        baseTemp: 50,
        maxTemp: 88,
        firstSpray: 250, // degree days
    },
    "Apple Scab": {
        baseTemp: 32,
        infectionPhase: 0, // 300 - 700 degree days
    },
};
let storedData = {
    Metric: {
        // dayDegreeDay: 0,
        wcDayDegreeDay: 0,
        lrDayDegreeDay: 0,
        cmDayDegreeDay: 0,
        asDayDegreeDay: 0,
        degreeDaysAccumulated: 0,
        dayLow: 1000,
        dayHigh: -1000,
        dayAverage: 0,
        timeOfLow: "",
        timeOfHigh: "",
        current: 0,
        totalRainfall: 0,
        dayRainfall: 0,
    },
};
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.listen(PORT, () => {
    console.log(`Server running on Render port ${PORT}`);
});
app.post("/post", asyncHandler(getProcessedData)); // Route to fetch and process data
app.get("/health", (req, res) => {
    // Health check route
    res.status(200).send("OK");
});
// Error-handling middleware
app.use((err, req, res, next) => {
    console.error("Error occurred:", err.message);
    res.status(err.status || 500).json({
        error: {
            message: err.message || "Internal Server Error",
        },
    });
});
/**
 *
 * @param specificDate The specific date to fetch data for
 * @param dayAfter The day after the specific date
 */
async function fetchAndStoreData(specificDate, dayAfter) {
    // Construct the query to filter data based on specificDate
    const query = {
        device: 12,
        id: 222,
        time: {
            $gte: new Date(specificDate).toISOString(),
            $lt: new Date(dayAfter).toISOString(),
        },
    };
    // Specify the fields to return in the projection (rainfall, humidity, temperature)
    const projection = {
        total_rainfall: 1,
        humidity: 1,
        temperature: 1,
        _id: 0, // Exclude the _id field
    };
    // Fetch the data based on the query and projection
    const results = await soacModel.find(query, projection).exec();
    // If no results found, throw an error
    if (!results || results.length === 0) {
        throw new Error("No data found");
    }
    // Log the request
    console.log("--------------------");
    console.log("Request Made");
    console.log("Date: " + JSON.stringify(specificDate));
    console.log("--------------------");
    // Process the data
    storeRain(results);
    storeHumindiy(results);
    storeTemperature(results);
    storeDegreeDay();
}
/**
 *
 * @param req The request object
 * @param res The response object
 * @param next The next middleware function
 */
async function getProcessedData(req, res, next) {
    try {
        // Parse request body
        const specificDate = req.body.date;
        const dayAfter = new Date(specificDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        console.log("Received request data:", req.body);
        // Fetch and process data
        const processedData = await fetchAndStoreData(specificDate, dayAfter);
        res.json(storedData.Metric); // Respond with processed data
    }
    catch (error) {
        console.error("Error occurred:", error.message);
        next(error); // Pass the error to error-handling middleware
    }
}
/**
 *
 * @param users The data to store the rainfall for
 */
function storeRain(users) {
    storedData.Metric.totalRainfall = millimeterToInchConversion(users[users.length - 1].total_rainfall);
    storedData.Metric.dayRainfall = millimeterToInchConversion(users[users.length - 1].total_rainfall - users[0].total_rainfall);
}
/**
 *
 * @param users The data to store the humidity for
 */
function storeHumindiy(users) {
    // Determins average humidity for the day
    sortMetric(users, "humidity"); // humidity
    // Sets Humidity in Percentage
    storedData.Metric.dayAverage = Number(storedData.Metric.dayAverage ?? 0);
}
/**
 *
 * @param users The data to store the temperature for
 */
function storeTemperature(users) {
    // Determines high and low temp for day
    sortMetric(users, "temperature");
    // Sets and Converts Celcius to Fahrenheit
    storedData.Metric.dayLow = Number(fahrenheitConversion(Number(storedData.Metric.dayLow ?? 0)));
    storedData.Metric.dayHigh = Number(fahrenheitConversion(Number(storedData.Metric.dayHigh ?? 0)));
    storedData.Metric.dayAverage = Number(fahrenheitConversion(Number(storedData.Metric.dayAverage ?? 0)));
    storedData.Metric.current = Number(fahrenheitConversion(Number(storedData.Metric.current ?? 0)));
}
/**
 * Stores the degree day for the day
 */
function storeDegreeDay() {
    storedData.Metric.wcDayDegreeDay =
        (Number(storedData.Metric.dayLow) + Number(storedData.Metric.dayHigh)) / 2 - Number(degreeDayType["Western Cherry"].baseTemp);
    storedData.Metric.lrDayDegreeDay =
        (Number(storedData.Metric.dayLow) + Number(storedData.Metric.dayHigh)) / 2 - Number(degreeDayType["Leaf Rollers"].baseTemp);
    storedData.Metric.cmDayDegreeDay =
        (Number(storedData.Metric.dayLow) + Number(storedData.Metric.dayHigh)) / 2 - Number(degreeDayType["Codling Moth"].baseTemp);
    storedData.Metric.asDayDegreeDay =
        (Number(storedData.Metric.dayLow) + Number(storedData.Metric.dayHigh)) / 2 - Number(degreeDayType["Apple Scab"].baseTemp);
    if ((storedData.Metric.wcDayDegreeDay ?? 0) < 0) {
        storedData.Metric.wcDayDegreeDay = 0;
    }
    if ((storedData.Metric.lrDayDegreeDay ?? 0) < 0) {
        storedData.Metric.lrDayDegreeDay = 0;
    }
    if ((storedData.Metric.cmDayDegreeDay ?? 0) < 0) {
        storedData.Metric.cmDayDegreeDay = 0;
    }
    if ((storedData.Metric.asDayDegreeDay ?? 0) < 0) {
        storedData.Metric.asDayDegreeDay = 0;
    }
}
/**
 *
 * @param celciusTemp The temperature in celcius to convert to fahrenheit
 * @returns The temperature in fahrenheit
 */
function fahrenheitConversion(celciusTemp) {
    let fahrenheitTemp = celciusTemp * (9 / 5) + 32;
    return fahrenheitTemp;
}
/**
 *
 * @param millimeters The amount of millimeters to convert to inches
 * @returns The amount of inches
 */
function millimeterToInchConversion(millimeters) {
    let inches = millimeters / 25.4;
    return inches;
}
/**
 *
 * @param results The data from the database
 * @param metric The metric to sort by
 */
function sortMetric(results, metric) {
    (storedData.Metric.dayLow = 1000), (storedData.Metric.dayHigh = -1000), (storedData.Metric.dayAverage = 0), (storedData.Metric.current = 0);
    let total = 0;
    for (let i = 0; i < results.length; i++) {
        if (results[i][metric] > (storedData.Metric.dayHigh ?? 0)) {
            storedData.Metric.dayHigh = results[i][metric];
            storedData.Metric.timeOfHigh = results[i].time;
        }
        if (results[i][metric] < (storedData.Metric.dayLow ?? 0)) {
            storedData.Metric.dayLow = results[i][metric];
            storedData.Metric.timeOfLow = results[i].time;
        }
        total += results[i][metric];
    }
    storedData.Metric.current = results[results.length - 1][metric];
    storedData.Metric.dayAverage = total / results.length;
}
