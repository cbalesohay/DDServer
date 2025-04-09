const myRequire = createRequire(import.meta.url);
myRequire("dotenv").config();
import { createRequire } from "module";
import soacDailyDDModel from "./SoacDailyDD.js";
import soacYearlyDDModel from "./SoacYearlyDD.js";
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
        wcDayDegreeDay: 0,
        lrDayDegreeDay: 0,
        cmDayDegreeDay: 0,
        asDayDegreeDay: 0,
        wcDDA: 0,
        lrDDA: 0,
        cmDDA: 0,
        asDDA: 0,
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
// Connection to Chris test database
mongoose
    .connect(MONGODB_URI_DD)
    .then(() => console.log("Connected to MongoDB PERSONAL"))
    .catch((err) => console.error("MongoDB connection error:", err));
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
app.post("/bulk", asyncHandler(fetchDegreeDayData)); // Route to fetch and process data
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
// async function fetchAndStoreData(specificDate: string, dayAfter: Date) {
//   // Construct the query to filter data based on specificDate
//   const query = {
//     device: 12,
//     id: 222,
//     time: {
//       $gte: new Date(specificDate).toISOString(),
//       $lt: new Date(dayAfter).toISOString(),
//     },
//   };
//   // Specify the fields to return in the projection (rainfall, humidity, temperature)
//   const projection = {
//     total_rainfall: 1,
//     humidity: 1,
//     temperature: 1,
//     _id: 0, // Exclude the _id field
//   };
//   // Fetch the data based on the query and projection
//   const results = await soacModel.find(query, projection).exec();
//   // If no results found, throw an error
//   if (!results || results.length === 0) {
//     throw new Error("No data found");
//   }
//   // Log the request
//   console.log("--------------------");
//   console.log("Request Made");
//   console.log("Date: " + JSON.stringify(specificDate));
//   console.log("--------------------");
//   // Process the data
//   storeRain(results);
//   storeHumindiy(results);
//   storeTemperature(results);
//   storeDegreeDay();
// }
async function fetchDegreeDayData() {
    const query = {
        name: "Western Cherry",
    };
    // Specify the fields to return in the projection (rainfall, humidity, temperature)
    const projection = {
        name: 1,
        DDA: 1,
        startDate: 1,
        _id: 0, // Exclude the _id field
    };
    // Fetch the data based on the query and projection
    // const results = await soacDDModel.find(query, projection).exec();
    const results = await soacDailyDDModel.find();
    const results2 = await soacYearlyDDModel.find();
    getRunningDDA("Western Cherry", new Date("2025-01-01"));
    // If no results found, throw an error
    if (!results || results.length === 0) {
        throw new Error("No data found");
    }
    if (!results2 || results2.length === 0) {
        throw new Error("No data found");
    }
    // Log the request
    console.log("--------------------");
    console.log("Request Made");
    console.log("for DDA: ");
    console.log("--------------------");
    // Process the data
    // console.log(results);
    // console.log(results2);
}
/**
 *
 * @param req The request object
 * @param res The response object
 * @param next The next middleware function
 */
async function sendProcessedData(req, res, next) {
    try {
        // Parse request body
        const specificDate = req.body.date;
        const dayAfter = new Date(specificDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        console.log("Received request data:", req.body);
        // Fetch and process data
        //const processedData = await fetchAndStoreData(specificDate, dayAfter);
        // Fetch DDA from database
        const dda = await fetchDegreeDayData();
        res.json(storedData.Metric); // Respond with processed data
    }
    catch (error) {
        console.error("Error occurred:", error.message);
        next(error); // Pass the error to error-handling middleware
    }
}
/**
 * @description Function to send the stored data to the client
 * @param req
 * @param res
 * @param next
 */
async function sendBulkData(req, res, next) {
    // Check to see if metric has degree days stored, if so then return the stored data
    try {
        const specificDate = req.body.date;
        const dayAfter = new Date(specificDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        console.log("Received request data:", req.body);
        // Fetch and process data
        //const processedData = await fetchAndStoreBulk(specificDate, dayAfter);
        res.json(storedData.Metric); // Respond with processed data
    }
    catch (error) {
        console.error("Error occurred:", error.message);
        next(error); // Pass the error to error-handling middleware
    }
}
const currentYear = new Date().getFullYear();
/**
 * @description Function to record degree day data per day
 * @param tempRunningDDA The degree day data to store
 */
async function storeDayDD(tempRunningDDA) {
    // Push the new degree day data to the database
    soacYearlyDDModel.updateOne({ name: "Western Cherry", startDate: { $gte: new Date(`${currentYear}-01-01`) } }, { $set: { totalDegreeDays: tempRunningDDA } }, { $set: { lastInput: new Date() } });
}
/**
 * @description Function call to record degree days from certain day to current day
 * @param name The name of the degree day to fetch
 * @param fromDate The date to fetch the degree day from
 * @returns For testing purposes, returns 0 if successful and -1 if there was an error
 */
async function getRunningDDA(name = "Western Cherry", fromDate = new Date(currentYear, 0)) {
    try {
        const results1 = await soacYearlyDDModel.find({ name: name }, { _id: 0, name: 1, totalDegreeDays: 1 }).exec();
        if (results1.length === 0) {
            throw new Error("No data found");
        }
        let tempRunningDDA = await calculateRunningDDA(fromDate);
        if (results1.totalDegreeDays !== tempRunningDDA || results1.length > tempRunningDDA) {
            // Assign tempRunningDDA to the totalDegreeDays
            storeDayDD(tempRunningDDA);
            const results2 = await soacYearlyDDModel.find({ name: name }, { _id: 0, name: 1, totalDegreeDays: 1 }).exec();
            console.log("Updated degree days: ", results2);
        }
        else {
            console.log("degree days: ", results1);
        }
    }
    catch (error) {
        console.error("Error occurred:", error.message);
        return -1;
    }
    return 0;
}
/**
 * @description Function to calculate running degree days
 * @param fromDate The date to calculate the degree days from
 * @returns For testing purposes, returns 0 if successful and -1 if there was an error
 */
async function calculateRunningDDA(fromDate = new Date(currentYear, 0)) {
    try {
        // Get the data from the database
        const results = await soacDailyDDModel.find({ name: "Western Cherry" }).exec();
        if (results.length === 0) {
            throw new Error("No data found");
        }
        let totalDegreeDays = 0;
        console.log("Results: ", results[0].degreeDays);
        for (let i = 0; i < results.length; i++) {
            totalDegreeDays += results[i].degreeDays;
        }
        console.log("Total degree days: ", totalDegreeDays);
        return totalDegreeDays;
    }
    catch (error) {
        console.error("Error occurred in calculateRunningDDA:", error.message);
        return -1;
    }
}
/**
 * @description Function to check if running dd are accurate and if not, update the database
 * @returns For testing purposes, returns 0 if successful and -1 if there was an error
 */
async function checkRunningDDA() {
    try {
        // This will compare the current running degree days vs the a new calculated running degree days
        let tempRunningDDA = await calculateRunningDDA();
        if (tempRunningDDA === (await getRunningDDA())) {
            // If they are the same, do nothing
            console.log("Running degree days are the same");
        }
        else {
            // and if they are not the same, update the database with the new calculated running degree days
            console.log("Running degree days are different");
            // Update the database with the new calculated running degree days
            storeDayDD(tempRunningDDA);
        }
    }
    catch (error) {
        console.error("Error occurred:", error.message);
        return -1;
    }
    return 0;
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
