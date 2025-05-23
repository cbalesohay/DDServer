// const myRequire = createRequire(import.meta.url);
// myRequire("dotenv").config();
// import { createRequire } from "module";
// import soacDailyDDModel from "./SoacDailyDD.js";
// import soacYearlyDDModel from "./SoacYearlyDD.js";
// import { Metric } from "./metric.js";
// import { get } from "http";
// import { start } from "repl";
// const express = myRequire("express");
// const bodyParser = myRequire("body-parser");
// const MONGODB_URI = process.env.API_KEY;
// const MONGODB_URI_DD = process.env.DD_API_KEY;
// const mongoose = myRequire("mongoose");
// const app = express();
// var cors = myRequire("cors");
// app.use(cors());
// const PORT = process.env.PORT || 4000;
// export default app;
export {};
// type DegreeDayType = {
//   [key: string]: {
//     baseTemp: number;
//     maxTemp?: number;
//     peakMothFlight?: number;
//     firstHatch?: number;
//     firstFlight?: number;
//     firstApplication?: number;
//     firstSpray?: number;
//     infectionPhase?: number;
//     ddAfterDate?: string;
//   };
// };
// // Don't think I need this
// const degreeDayType: DegreeDayType = {
//   "Western Cherry": {
//     baseTemp: 41,
//     ddAfterDate: "05-01",
//     firstFlight: 950, // degree days after March 1st
//     firstApplication: 1060, // on or before 1060 degree days
//   },
//   "Leaf Rollers": {
//     baseTemp: 41,
//     maxTemp: 85,
//     peakMothFlight: 0, // 220 -250 degree days
//     firstHatch: 420, // degree days
//   },
//   "Codling Moth": {
//     baseTemp: 50,
//     maxTemp: 88,
//     firstSpray: 250, // degree days
//   },
//   "Apple Scab": {
//     baseTemp: 32,
//     infectionPhase: 0, // 300 - 700 degree days
//   },
// };
// type MetricName = ["Western Cherry", "Leaf Rollers", "Codling Moth", "Apple Scab"];
// let metricName: MetricName = ["Western Cherry", "Leaf Rollers", "Codling Moth", "Apple Scab"];
// type PestData = {
//   dailyDegreeDays: number;
//   totalDegreeDays: number;
//   startDate: string | Date;
//   endDate: string | Date;
// };
// type MetricData = {
//   "Western Cherry": PestData;
//   "Leaf Rollers": PestData;
//   "Codling Moth": PestData;
//   "Apple Scab": PestData;
//   dayLow: number;
//   dayHigh: number;
//   dayAverage: number;
//   timeOfLow: string;
//   timeOfHigh: string;
//   current: number;
//   totalRainfall: number;
//   dayRainfall: number;
// };
// // type StoredData = {
// //   Metric: MetricData;
// // };
// // let storedData: StoredData = {
// //   Metric: {
// //     "Western Cherry": {
// //       dailyDegreeDays: 0,
// //       totalDegreeDays: 0,
// //       startDate: "",
// //       endDate: "",
// //     },
// //     "Leaf Rollers": {
// //       dailyDegreeDays: 0,
// //       totalDegreeDays: 0,
// //       startDate: "",
// //       endDate: "",
// //     },
// //     "Codling Moth": {
// //       dailyDegreeDays: 0,
// //       totalDegreeDays: 0,
// //       startDate: "",
// //       endDate: "",
// //     },
// //     "Apple Scab": {
// //       dailyDegreeDays: 0,
// //       totalDegreeDays: 0,
// //       startDate: "",
// //       endDate: "",
// //     },
// //     dayLow: 1000,
// //     dayHigh: -1000,
// //     dayAverage: 0,
// //     timeOfLow: "",
// //     timeOfHigh: "",
// //     current: 0,
// //     totalRainfall: 0,
// //     dayRainfall: 0,
// //   },
// // };
// interface StoredData {
//   metrics: { [name: string]: Metric }; // OR Metric[]
//   weather: {
//     dayLow: number;
//     dayHigh: number;
//     dayAverage: number;
//     timeOfLow: string;
//     timeOfHigh: string;
//     current: number;
//     totalRainfall: number;
//     dayRainfall: number;
//   };
// }
// let storedData: StoredData = {
//   metrics: {
//     "Western Cherry": new Metric("Western Cherry", 41),
//     "Leaf Rollers": new Metric("Leaf Rollers", 41),
//     "Codling Moth": new Metric("Codling Moth", 50),
//     "Apple Scab": new Metric("Apple Scab", 32),
//   },
//   weather: {
//     dayLow: 1000,
//     dayHigh: -1000,
//     dayAverage: 0,
//     timeOfLow: "",
//     timeOfHigh: "",
//     current: 0,
//     totalRainfall: 0,
//     dayRainfall: 0,
//   },
// };
// const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };
// // For reference of connecting two clusters for another day
// // https://stackoverflow.com/questions/76358813/how-can-i-connect-two-different-mongodb-clusters-to-my-express-js-backend-using
// // Connection to Chris test database
// mongoose
//   .connect(MONGODB_URI_DD)
//   .then(() => console.log("Connected to MongoDB PERSONAL"))
//   .catch((err: any) => console.error("MongoDB connection error:", err));
// // Connection to SOAC test database
// // mongoose
// //   .connect(MONGODB_URI)
// //   .then(() => console.log("Connected to MongoDB"))
// //   .catch((err: any) => console.error("MongoDB connection error:", err));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.json());
// app.listen(PORT, () => {
//   console.log(`Server running on Render port ${PORT}`);
// });
// // app.post("/post", asyncHandler(getProcessedData)); // Route to fetch and process data
// app.post("/sendData", asyncHandler(sendProcessedData)); // Sends most updated data
// app.post("/newDate", asyncHandler(setNewDate));
// app.get("/health", (req: any, res: any) => {
//   res.status(200).send("OK"); // Health check route
// });
// // Error-handling middleware
// app.use((err: any, req: any, res: any, next: any) => {
//   console.error("Error occurred:", err.message);
//   res.status(err.status || 500).json({
//     error: {
//       message: err.message || "Internal Server Error",
//     },
//   });
// });
// /**
//  *
//  * @param specificDate The specific date to fetch data for
//  * @param dayAfter The day after the specific date
//  */
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
//   const results = await soacDailyDDModel.find(query, projection).exec();
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
// /**
//  *
//  * @param req The request object
//  * @param res The response object
//  * @param next The next middleware function
//  */
// async function sendProcessedData(req: any, res: any, next: any) {
//   try {
//     // Parse request body
//     const specificDate = req.body.date;
//     const dayAfter = new Date(specificDate);
//     dayAfter.setDate(dayAfter.getDate() + 1);
//     // Fetch and store data
//     await getYearData();
//     await calculateRunningDDA();
//     // res.json(storedData.Metric); // Respond with processed data
//     res.json(storedData.metrics); // Respond with processed data
//     return 0;
//   } catch (error) {
//     throw new Error("Error occurred in sendProcessedData");
//   }
// }
// async function setNewDate(req: any, res: any) {
//   try {
//     const name = req.body.name;
//     const newStartDate = req.body.startDate || null;
//     const newEndDate = req.body.endDate || null;
//     await storeNewDate(name, newStartDate, newEndDate);
//     res.status(200).json({ message: "Success" });
//     // Log the request
//     console.log("------------------------------");
//     console.log("Change Made");
//     console.log("Name:       " + name);
//     if (newStartDate != null) console.log("Start Date: " + newStartDate);
//     if (newEndDate != null) console.log("End Date:   " + newEndDate);
//     console.log("------------------------------");
//     return 0;
//   } catch (error) {
//     res.status(400).json({ message: "Error" });
//     throw new Error("Error setting new date");
//   }
// }
// const currentYear = new Date().getFullYear();
// /**
//  * @description Function to record degree day data per day
//  * @param tempRunningDDA The degree day data to store
//  */
// async function storeDayDD(name: string, tempRunningDDA: number) {
//   // Push the new degree day data to the database
//   try {
//     await soacYearlyDDModel.updateOne(
//       { name: name, startDate: { $gte: new Date(`${currentYear}-01-01`).toISOString().slice(0, 10) } },
//       { $set: { totalDegreeDays: tempRunningDDA, lastInput: new Date().toISOString().slice(0, 10) } },
//     );
//     return 0;
//   } catch (error) {
//     throw new Error("Error occurred is storeDayDD");
//   }
// }
// /**
//  *
//  * @param name
//  * @param changeStart
//  * @param changeEnd
//  * @returns
//  */
// async function storeNewDate(name: string, changeStart?: string | Date | null, changeEnd?: string | Date | null) {
//   try {
//     const filter = {
//       name: name,
//       startDate: { $gte: new Date(`${currentYear}-01-01`).toISOString().slice(0, 10) },
//     };
//     if (changeStart != null && changeEnd != null) {
//       await soacYearlyDDModel.updateMany(filter, { $set: { startDate: changeStart, endDate: changeEnd } });
//       // storedData.Metric[metricName[0]].startDate = changeStart;
//       // storedData.Metric[metricName[0]].endDate = changeEnd;
//       storedData.metrics[metricName[0]].startDate = changeStart;
//       storedData.metrics[metricName[0]].endDate = changeEnd;
//     } else if (changeStart != null) {
//       await soacYearlyDDModel.updateOne(filter, { $set: { startDate: changeStart } });
//       // storedData.Metric[metricName[0]].startDate = changeStart;
//       storedData.metrics[metricName[0]].startDate = changeStart;
//     } else if (changeEnd != null) {
//       await soacYearlyDDModel.updateOne(filter, { $set: { endDate: changeEnd } });
//       // storedData.Metric[metricName[0]].endDate = changeEnd;
//       storedData.metrics[metricName[0]].endDate = changeEnd;
//     }
//     return 0;
//   } catch (error) {
//     throw new Error("Error occurred in storeNewDate");
//   }
// }
// /**
//  * @description Function to get the year data from the database
//  * @returns The year data from the database
//  */
// async function getYearData() {
//   try {
//     const filter = {
//       startDate: { $gte: new Date(`${currentYear}-01-01`).toISOString().slice(0, 10) },
//     };
//     const data = await soacYearlyDDModel.find(filter);
//     for (let i = 0; i < metricName.length; i++) {
//       // storedData.Metric[metricName[i]].startDate = data[i].startDate;
//       // storedData.Metric[metricName[i]].endDate = data[i].endDate;
//       // storedData.Metric[metricName[i]].totalDegreeDays = data[i].totalDegreeDays;
//       storedData.metrics[metricName[i]].startDate = data[i].startDate;
//       storedData.metrics[metricName[i]].endDate = data[i].endDate;
//       storedData.metrics[metricName[i]].totalDegreeDays = data[i].totalDegreeDays;
//     }
//   } catch (error) {
//     console.error("Error occurred in getYearData:", error);
//     throw new Error("Error occurred in getDates");
//   }
// }
// /**
//  * @description Function to calculate running degree days
//  * @returns For testing purposes, returns 0 if successful and -1 if there was an error
//  */
// async function calculateRunningDDA() {
//   for (let i = 0; i < 4; i++) {
//     let totalDegreeDays = 0;
//     // Get Daily data here
//     try {
//       // const dailyData = await soacDailyDDModel.find({ name: metricName[i], date: { $gte: storedData.Metric[metricName[i]].startDate } }).exec();
//       const dailyData = await soacDailyDDModel.find({ name: metricName[i], date: { $gte: storedData.metrics[metricName[i]].startDate } }).exec();
//       if (dailyData.length === 0) {
//         throw new Error("No data found");
//       }
//       // Tally DD's
//       for (let j = 0; j < dailyData.length; j++) {
//         totalDegreeDays += dailyData[j].degreeDays;
//       }
//       // If DD's are updated, then store updated data
//       // if (
//       //   storedData.Metric[metricName[i]].totalDegreeDays < totalDegreeDays ||
//       //   storedData.Metric[metricName[i]].totalDegreeDays !== totalDegreeDays
//       // ) {
//       //   await storeDayDD(metricName[i], totalDegreeDays); // Assign tempRunningDDA to the totalDegreeDays
//       // }
//       if (
//         storedData.metrics[metricName[i]].totalDegreeDays < totalDegreeDays ||
//         storedData.metrics[metricName[i]].totalDegreeDays !== totalDegreeDays
//       ) {
//         await storeDayDD(metricName[i], totalDegreeDays); // Assign tempRunningDDA to the totalDegreeDays
//       }
//       // Store the data
//       // storedData.Metric[metricName[i]].totalDegreeDays = totalDegreeDays; // Store total Degree Days
//       storedData.metrics[metricName[i]].totalDegreeDays = totalDegreeDays; // Store total Degree Days
//     } catch (error) {
//       console.error("Error occurred getting daily data:", error);
//       throw new Error("Error occurred in getting daily data");
//     }
//     try {
//       const currDayData = await soacDailyDDModel.find({ name: metricName[i], date: { $gte: new Date().toISOString().slice(0, 10) } }).exec();
//       if (currDayData.length === 0) {
//         throw new Error("No data found");
//       }
//       // storedData.Metric[metricName[i]].dailyDegreeDays = currDayData[0].degreeDays; // Store daily Degree Days
//       storedData.metrics[metricName[i]].dailyDegreeDays = currDayData[0].degreeDays; // Store daily Degree Days
//     } catch (error) {
//       // storedData.Metric[metricName[i]].dailyDegreeDays = 0; // Store daily Degree Days
//       storedData.metrics[metricName[i]].dailyDegreeDays = 0; // Store daily Degree Days
//       console.log("Error occurred getting curr day data:", error);
//       throw new Error("Error occurred in getting curr day data");
//     }
//   }
// }
// /**
//  *
//  * @param users The data to store the rainfall for
//  */
// function storeRain(users: any) {
//   // storedData.Metric.totalRainfall = millimeterToInchConversion(users[users.length - 1].total_rainfall);
//   // storedData.Metric.dayRainfall = millimeterToInchConversion(users[users.length - 1].total_rainfall - users[0].total_rainfall);
//   storedData.weather.totalRainfall = millimeterToInchConversion(users[users.length - 1].total_rainfall);
//   storedData.weather.dayRainfall = millimeterToInchConversion(users[users.length - 1].total_rainfall - users[0].total_rainfall);
// }
// /**
//  *
//  * @param users The data to store the humidity for
//  */
// function storeHumindiy(users: any) {
//   // Determins average humidity for the day
//   sortMetric(users, "humidity"); // humidity
//   // Sets Humidity in Percentage
//   // storedData.Metric.dayAverage = Number(storedData.Metric.dayAverage ?? 0);
//   storedData.weather.dayAverage = Number(storedData.weather.dayAverage ?? 0);
// }
// /**
//  *
//  * @param users The data to store the temperature for
//  */
// function storeTemperature(users: any) {
//   // Determines high and low temp for day
//   sortMetric(users, "temperature");
//   // Sets and Converts Celcius to Fahrenheit
//   // storedData.Metric.dayLow = Number(fahrenheitConversion(Number(storedData.Metric.dayLow ?? 0)));
//   // storedData.Metric.dayHigh = Number(fahrenheitConversion(Number(storedData.Metric.dayHigh ?? 0)));
//   // storedData.Metric.dayAverage = Number(fahrenheitConversion(Number(storedData.Metric.dayAverage ?? 0)));
//   // storedData.Metric.current = Number(fahrenheitConversion(Number(storedData.Metric.current ?? 0)));
//   storedData.weather.dayLow = Number(fahrenheitConversion(Number(storedData.weather.dayLow ?? 0)));
//   storedData.weather.dayHigh = Number(fahrenheitConversion(Number(storedData.weather.dayHigh ?? 0)));
//   storedData.weather.dayAverage = Number(fahrenheitConversion(Number(storedData.weather.dayAverage ?? 0)));
//   storedData.weather.current = Number(fahrenheitConversion(Number(storedData.weather.current ?? 0)));
// }
// /**
//  * Stores the degree day for the day
//  */
// function storeDegreeDay() {
//   for (let i = 0; i < metricName.length; i++) {
//     // storedData.Metric[metricName[i]].dailyDegreeDays =
//     //   (Number(storedData.Metric.dayLow) + Number(storedData.Metric.dayHigh)) / 2 - Number(degreeDayType[metricName[i]].baseTemp);
//     storedData.metrics[metricName[i]].dailyDegreeDays =
//       (Number(storedData.weather.dayLow) + Number(storedData.weather.dayHigh)) / 2 - Number(degreeDayType[metricName[i]].baseTemp);
//     // if ((storedData.Metric[metricName[i]].dailyDegreeDays ?? 0) < 0) {
//     //   storedData.Metric[metricName[i]].dailyDegreeDays = 0;
//     // }
//     if ((storedData.metrics[metricName[i]].dailyDegreeDays ?? 0) < 0) {
//       storedData.metrics[metricName[i]].dailyDegreeDays = 0;
//     }
//   }
// }
// /**
//  *
//  * @param celciusTemp The temperature in celcius to convert to fahrenheit
//  * @returns The temperature in fahrenheit
//  */
// function fahrenheitConversion(celciusTemp: number) {
//   let fahrenheitTemp = celciusTemp * (9 / 5) + 32;
//   return fahrenheitTemp;
// }
// /**
//  *
//  * @param millimeters The amount of millimeters to convert to inches
//  * @returns The amount of inches
//  */
// function millimeterToInchConversion(millimeters: number) {
//   let inches = millimeters / 25.4;
//   return inches;
// }
// /**
//  *
//  * @param results The data from the database
//  * @param metric The metric to sort by
//  */
// function sortMetric(results: any, metric: string) {
//   // (storedData.Metric.dayLow = 1000), (storedData.Metric.dayHigh = -1000), (storedData.Metric.dayAverage = 0), (storedData.Metric.current = 0);
//   (storedData.weather.dayLow = 1000), (storedData.weather.dayHigh = -1000), (storedData.weather.dayAverage = 0), (storedData.weather.current = 0);
//   let total = 0;
//   for (let i = 0; i < results.length; i++) {
//     // if (results[i][metric] > (storedData.Metric.dayHigh ?? 0)) {
//     //   storedData.Metric.dayHigh = results[i][metric];
//     //   storedData.Metric.timeOfHigh = results[i].time;
//     // }
//     // if (results[i][metric] < (storedData.Metric.dayLow ?? 0)) {
//     //   storedData.Metric.dayLow = results[i][metric];
//     //   storedData.Metric.timeOfLow = results[i].time;
//     // }
//     if (results[i][metric] > (storedData.weather.dayHigh ?? 0)) {
//       storedData.weather.dayHigh = results[i][metric];
//       storedData.weather.timeOfHigh = results[i].time;
//     }
//     if (results[i][metric] < (storedData.weather.dayLow ?? 0)) {
//       storedData.weather.dayLow = results[i][metric];
//       storedData.weather.timeOfLow = results[i].time;
//     }
//     total += results[i][metric];
//   }
//   // storedData.Metric.current = results[results.length - 1][metric];
//   // storedData.Metric.dayAverage = total / results.length;
//   storedData.weather.current = results[results.length - 1][metric];
//   storedData.weather.dayAverage = total / results.length;
// }
