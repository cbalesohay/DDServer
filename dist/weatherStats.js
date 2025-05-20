import soacDailyDDModel from './SoacDailyDD.js';
/**
 * @description Class to store the weather data
 */
export class WeatherStats {
    dayLow = 1000;
    dayHigh = -1000;
    dayAverage = 0;
    timeOfLow = '';
    timeOfHigh = '';
    current = 0;
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
        let today;
        if (date)
            today = new Date(date);
        else
            today = new Date();
        // Construct the query to filter data based on specificDate
        const query = {
            device: 12,
            id: 222,
            time: {
                $gte: new Date(today).toISOString(),
                $lt: new Date(today.setDate(today.getDate() + 1)).toISOString(),
            },
        };
        // Specify the fields to return in the projection (rainfall, humidity, temperature)
        const projection = {
            total_rainfall: 1,
            humidity: 1,
            temperature: 1,
            _id: 0, // Exclude the _id field
        };
        try {
            // Fetch the data based on the query and projection
            // const results = await model.find(query, projection).exec();
            const results = await soacDailyDDModel.find(query, projection).exec();
            // If no results found, throw an error
            if (!results || results.length === 0) {
                throw new Error('No data found');
            }
            // Sorts the data
            this.storeTemperature(results);
            this.storeHumidity(results);
            this.storeRain(results);
        }
        catch (error) {
            console.error('Error occurred in storeWeatherData:', error);
            throw new Error('Error occurred in storeWeatherData');
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
        // Determins average humidity for the day
        this.sortMetric(users, 'humidity'); // humidity
        // Sets Humidity in Percentage
        this.dayAverage = Number(this.dayAverage ?? 0);
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
        this.current = Number(this.fahrenheitConversion(Number(this.current)));
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
        this.current = 0;
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
        this.current = results[results.length - 1][metric];
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
            current: this.current,
            totalRainfall: this.totalRainfall,
            dayRainfall: this.dayRainfall,
        };
    }
}
