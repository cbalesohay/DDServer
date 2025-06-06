import { PestDatabase } from './pestDatabase.js';
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
  private db: PestDatabase;

  constructor(init_db: PestDatabase) {
    this.db = init_db;
  }

  /**
   *
   * @returns The current low temperature
   */
  get_low_temp() {
    return this.day_low;
  }

  /**
   *
   * @returns The current high temperature
   */
  get_high_temp() {
    return this.day_high;
  }

  get_curr_temp() {
    return this.curr_temp;
  }

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
   *
   * @param users The data to store the weather data for
   * @description Function to store the weather data
   */
  // async store_weather_data(model: any, date?: Date) {
  async store_weather_data(date?: Date) {
    const dateObj = date ? new Date(date) : new Date();
    const { start_utc, end_utc } = this.get_start_and_end_dates(dateObj);

    try {
      const results = await this.db.find_day_data(start_utc, end_utc);

      if (results.length !== 0) {
        // Sorts the data
        this.store_temperature(results);
        this.store_humidity(results);
        this.store_rain(results);
      }
    } catch (error) {
      console.error('Error occurred in store_weather_data:', error);
    }
  }

  /**
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
   *
   * @param users The data to store the humidity for
   */
  private store_humidity(users: WeatherReading[]) {
    let hum = users[users.length - 1]['humidity'] ?? 0;
    this.curr_humidity = hum > 0 ? hum : 0; // Ensure humidity is not negative
  }

  /**
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
   *
   * @param celciusTemp The temperature in celcius to convert to fahrenheit
   * @returns The temperature in fahrenheit
   */
  private fahrenheit_conversion(celcius: number) {
    return celcius * (9 / 5) + 32;
  }

  /**
   *
   * @param millimeters The amount of millimeters to convert to inches
   * @returns The amount of inches
   */
  private millimeter_to_inch_conversion(mm: number) {
    let conversion = mm / 25.4; // 1 inch = 25.4 mm
    return conversion > 0 ? conversion : 0; // Ensure no negative rainfall
  }

  /**
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
