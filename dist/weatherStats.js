import { DataProcessor } from './dataProcessor.js';
import soacDailyDDModel from './SoacDailyDD.js';
import soacTotalDDModel from './SoacTotalDD.js';
import soacYearlyDDModel from './SoacYearlyDD.js';
/**
 * @description Class to store the weather data
 */
export class WeatherStats {
    dayLow = 1000;
    dayHigh = -1000;
    dayAverage = 0;
    timeOfLow = '';
    timeOfHigh = '';
    currTemp = 0;
    currHumidity = 0;
    totalRainfall = 0;
    dayRainfall = 0;
    /**
     *
     * @returns The current low temperature
     */
    getLowTemp() {
        return this.dayLow;
    }
    /**
     *
     * @returns The current high temperature
     */
    getHighTemp() {
        return this.dayHigh;
    }
    /**
     *
     * @param users The data to store the weather data for
     * @description Function to store the weather data
     */
    // async storeWeatherData(model: any, date?: Date) {
    async storeWeatherData(date) {
        const dateObj = date ? new Date(date) : new Date();
        dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
        // Fetches the data from the database
        const data = new DataProcessor(12, 171, soacTotalDDModel, soacDailyDDModel, soacYearlyDDModel);
        try {
            const results = await data.fetchWeatherSaocData(dateObj);
            if (results.length !== 0) {
                // Sorts the data
                this.storeTemperature(results);
                this.storeHumidity(results);
                this.storeRain(results);
            }
        }
        catch (error) {
            console.error('Error occurred in storeWeatherData:', error);
        }
    }
    /**
     *
     * @param users The data to store the rainfall for
     */
    storeRain(users) {
        this.totalRainfall = this.millimeterToInchConversion(users[users.length - 1].total_rainfall ?? 0);
        this.dayRainfall = this.millimeterToInchConversion((users[users.length - 1].total_rainfall ?? 0) - (users[0].total_rainfall ?? 0));
    }
    /**
     *
     * @param users The data to store the humidity for
     */
    storeHumidity(users) {
        this.currHumidity = users[users.length - 1]['humidity'] ?? 0;
    }
    /**
     *
     * @param users The data to store the temperature for
     */
    storeTemperature(users) {
        // Determines high and low temp for day
        this.sortMetric(users, 'temperature');
        // Sets and Converts Celcius to Fahrenheit
        this.dayLow = Number(this.fahrenheitConversion(Number(this.dayLow)));
        this.dayHigh = Number(this.fahrenheitConversion(Number(this.dayHigh)));
        this.dayAverage = Number(this.fahrenheitConversion(Number(this.dayAverage)));
        this.currTemp = Number(this.fahrenheitConversion(Number(this.currTemp)));
    }
    /**
     *
     * @param celciusTemp The temperature in celcius to convert to fahrenheit
     * @returns The temperature in fahrenheit
     */
    fahrenheitConversion(celcius) {
        return celcius * (9 / 5) + 32;
    }
    /**
     *
     * @param millimeters The amount of millimeters to convert to inches
     * @returns The amount of inches
     */
    millimeterToInchConversion(mm) {
        return mm / 25.4;
    }
    /**
     *
     * @param results The data from the database
     * @param metric The metric to sort by
     */
    sortMetric(results, metric) {
        this.dayLow = 1000;
        this.dayHigh = -1000;
        this.dayAverage = 0;
        this.currTemp = 0;
        let total = 0;
        for (let i = 0; i < results.length; i++) {
            const value = results[i][metric];
            if (value == null)
                continue;
            if (value > (this.dayHigh ?? 0)) {
                this.dayHigh = value;
                this.timeOfHigh = results[i].time;
            }
            if (value < (this.dayLow ?? 0)) {
                this.dayLow = value;
                this.timeOfLow = results[i].time;
            }
            total += value;
        }
        this.currTemp = results[results.length - 1][metric];
        this.dayAverage = total / results.length;
    }
    /**
     *
     * @returns relevant data
     */
    toJSON() {
        return {
            dayLow: this.dayLow,
            dayHigh: this.dayHigh,
            dayAverage: this.dayAverage,
            timeOfLow: this.timeOfLow,
            timeOfHigh: this.timeOfHigh,
            currTemp: this.currTemp,
            totalRainfall: this.totalRainfall,
            dayRainfall: this.dayRainfall,
        };
    }
}
