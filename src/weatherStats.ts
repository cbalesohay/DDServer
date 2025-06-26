// Total lines of code: 220
import { MetricDatabase } from './metricDatabase.js';
import { DateTime } from 'luxon';

interface WeatherReading {
  time: string;
  temperature?: number;
  humidity?: number;
  total_rainfall?: number;
}

/**
 * @description Class to store the weather data
 */
export class WeatherStats {
  private day_low = 1000.0;
  private day_high = -1000.0;
  private day_average = 0.0;
  private time_of_low = '';
  private time_of_high = '';
  private curr_temp = 0.0;
  private curr_humidity = 0.0;
  private total_rainfall = 0.0;
  private day_rainfall = 0.0;
  private db: MetricDatabase;

  public available_data: Boolean = true;

  constructor(init_db: MetricDatabase) {
    this.db = init_db;
  }

  /**
   * @description Function to get the current low temperature
   *
   * @returns The current low temperature
   */
  get_low_temp() {
    return this.day_low;
  }

  /**
   * @description Function to get the current high temperature
   *
   * @returns The current high temperature
   */
  get_high_temp() {
    return this.day_high;
  }

  /**
   * @description Function to get the current average temperature
   * 
   * @returns The current average temperature
   */
  get_curr_temp() {
    return this.curr_temp;
  }

  /**
   * @description Function to get the start and end dates for the weather data
   * 
   * @param today The date to get the start and end dates for
   * @returns The start and end dates in UTC format
   */
  get_start_and_end_dates(today: Date): { start_utc: Date; end_utc: Date } {
    const startLocal = DateTime.fromJSDate(today, { zone: 'America/Los_Angeles' }).startOf('day');
    const nowLocal = DateTime.now().setZone('America/Los_Angeles');

    const isToday = startLocal.hasSame(nowLocal, 'day');
    const endLocal = isToday ? nowLocal : startLocal.plus({ days: 1 });

    const start_utc = startLocal.toUTC().toJSDate();
    const end_utc = endLocal.toUTC().toJSDate();

    return { start_utc, end_utc };
  }

  /**
   * @description Function to store the weather data
   *
   * @param users The data to store the weather data for
   */
  // async store_weather_data(model: any, date?: Date) {
  async store_weather_data(date?: Date) {
    const dateObj = date ? new Date(date) : new Date();
    const { start_utc, end_utc } = this.get_start_and_end_dates(dateObj);

    this.available_data = false; // Set to false if an error occurs

    try {
      const results = await this.db.find_day_data(start_utc, end_utc);

      if (results.length !== 0) {
        // Sorts the data
        this.available_data = true; // Set to true if data is available
        this.store_temperature(results);
        this.store_humidity(results);
        this.store_rain(results);
      }
    } catch (error) {
      console.error('Error occurred in store_weather_data:', error);
    }
  }

  /**
   * @description This function calculates the total rainfall and daily rainfall
   *
   * @param users The data to store the rainfall for
   */
  private store_rain(users: WeatherReading[]) {
    let rainfall_end = users[users.length - 1]['total_rainfall'] ?? 0;
    let rainfall_start = users[0]['total_rainfall'] ?? 0;
    this.total_rainfall = this.millimeter_to_inch_conversion(rainfall_end);
    this.day_rainfall = this.millimeter_to_inch_conversion(rainfall_end - rainfall_start);
  }

  /**
   * @description This function calculates the current humidity
   *
   * @param users The data to store the humidity for
   */
  private store_humidity(users: WeatherReading[]) {
    let hum = users[users.length - 1]['humidity'] ?? 0;
    this.curr_humidity = hum > 0 ? hum : 0; // Ensure humidity is not negative
  }

  /**
   * @description This function calculates the high, low, and average temperature for the day
   *
   * @param users The data to store the temperature for
   */
  private store_temperature(users: WeatherReading[]) {
    // Determines high and low temp for day
    this.sort_metric(users, 'temperature');

    // Sets and Converts Celcius to Fahrenheit
    this.day_low = Number(this.fahrenheit_conversion(Number(this.day_low)));
    this.day_high = Number(this.fahrenheit_conversion(Number(this.day_high)));
    this.day_average = Number(this.fahrenheit_conversion(Number(this.day_average)));
    this.curr_temp = Number(this.fahrenheit_conversion(Number(this.curr_temp)));
  }

  /**
   * @description Converts Celcius to Fahrenheit
   * 9/5 * C + 32 = F
   *
   * @param celciusTemp The temperature in celcius to convert to fahrenheit
   * @returns The temperature in fahrenheit
   */
  private fahrenheit_conversion(celcius: number) {
    return celcius * (9 / 5) + 32;
  }

  /**
   * @description Converts millimeters to inches
   *
   * @param millimeters The amount of millimeters to convert to inches
   * @returns The amount of inches
   */
  private millimeter_to_inch_conversion(mm: number) {
    let conversion = mm / 25.4; // 1 inch = 25.4 mm
    return conversion > 0 ? conversion : 0; // Ensure no negative rainfall
  }

  /**
   * @description This function sorts the data by the specified metric and calculates the high, low, average, and current temperature
   *
   * @param results The data from the database
   * @param metric The metric to sort by
   */
  private sort_metric(results: any, metric: string) {
    this.day_low = 1000;
    this.day_high = -1000;
    this.day_average = 0;
    this.curr_temp = 0;
    let total = 0;

    for (let i = 0; i < results.length; i++) {
      const value = results[i][metric];
      if (value == null) continue;

      if (value > (this.day_high ?? 0)) {
        this.day_high = value;
        this.time_of_high = results[i]['time']; // Ensure time is set correctly
      }

      if (value < (this.day_low ?? 0)) {
        this.day_low = value;
        this.time_of_low = results[i]['time']; // Ensure time is set correctly
      }

      total += value;
    }

    if (results.length !== 0) {
      this.curr_temp = results[results.length - 1][metric]; // Set current temperature to the last value
      this.day_average = total / results.length; // Calculate average temperature
    }
  }

  /**
   * @description Function to convert the weather stats to JSON format
   *
   * @returns relevant data
   */
  toJSON() {
    return {
      day_low: this.day_low,
      day_high: this.day_high,
      day_average: this.day_average,
      time_of_low: this.time_of_low,
      time_of_high: this.time_of_high,
      curr_temp: this.curr_temp,
      curr_humidity: this.curr_humidity,
      day_rainfall: this.day_rainfall,
      total_rainfall: this.total_rainfall,
    };
  }
}