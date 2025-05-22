import { WeatherStats } from './weatherStats.js';
import soacDailyDDModel from './SoacDailyDD.js';
import soacYearlyDDModel from './SoacYearlyDD.js';
import soacTotalDDModel from './SoacTotalDD.js';
import { start } from 'repl';

/**
 * @description Class to represent a pest
 */
export class Pest {
  public currentYear = new Date().getFullYear();
  public readonly name: string;
  public baseTemp: number;
  public maxTemp?: number;
  public thresholds?: {
    peakMothFlight?: number;
    firstHatch?: number;
    firstFlight?: number;
    firstApplication?: number;
    firstSpray?: number;
    infectionPhase?: number;
    ddAfterDate?: string;
  };

  private dailyDegreeDays: number = 0;
  private totalDegreeDays: number = 0;
  // private startDate: string | Date = `${this.currentYear}-01-01`;
  // private endDate: string | Date = `${this.currentYear}-12-31`;
  private startDate: Date = new Date(this.currentYear ?? new Date().getFullYear(), 0, 1);
  private endDate: Date = new Date(this.currentYear ?? new Date().getFullYear(), 11, 31);
  private tempDayLow: number = 0;
  private tempDayHigh: number = 0;
  private weatherStats: WeatherStats = new WeatherStats();

  constructor(name: string, base: number) {
    this.name = name;
    this.baseTemp = base;

    this.startDate.setHours(0, 0, 0, 0);
    this.endDate.setHours(23, 59, 59, 999); // end of day
  }

  updateDailyDegreeDays(dd: number) {
    this.dailyDegreeDays = dd;
  }

  updateTotalDegreeDays(dd: number) {
    this.totalDegreeDays = dd;
  }

  updateStartDate(date: Date) {
    this.startDate = date;
  }

  updateEndDate(date: Date) {
    this.endDate = date;
  }

  resetDailyDegreeDays() {
    this.dailyDegreeDays = 0;
  }

  getDailyDegreeDays() {
    return this.dailyDegreeDays;
  }

  getTotalDegreeDays() {
    return this.totalDegreeDays;
  }

  getStartDate() {
    return this.startDate;
  }

  getEndDate() {
    return this.endDate;
  }

  /**
   * @description Function to get the year data from the database
   * @returns The year data from the database
   */
  async getYearData() {
    try {
      const dateObj = new Date(this.currentYear, 0, 1);
      dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
      const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

      const filter = {
        name: this.name,
        startDate: {
          $gte: formattedDate,
        },
      };

      const data = await soacYearlyDDModel.find(filter);
      if (data.length === 0) throw new Error('No data found');

      this.updateStartDate(data[0].startDate);
      this.updateEndDate(data[0].endDate);
      this.updateTotalDegreeDays(data[0].totalDegreeDays);
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param name
   * @param changeStart
   * @param changeEnd
   * @returns
   */
  async storeNewDate(changeStart: Date | null, changeEnd: Date | null) {
    try {
      const dateObj = new Date(this.currentYear, 0, 1);
      dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
      const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

      const filter = {
        name: this.name,
        startDate: {
          $gte: formattedDate,
        },
      };

      // Creates doc if does not exist
      const exists = await soacYearlyDDModel.find({ name: this.name });
      if (exists.length === 0) await this.addNewYearlyDataPoint();

      if (changeStart != null && changeEnd != null) {
        await soacYearlyDDModel.updateMany(filter, {
          $set: { startDate: changeStart, endDate: changeEnd },
        });
        this.updateStartDate(changeStart);
        this.updateEndDate(changeEnd);
      } else if (changeStart != null) {
        await soacYearlyDDModel.updateOne(filter, {
          $set: { startDate: changeStart },
        });
        this.updateStartDate(changeStart);
      } else if (changeEnd != null) {
        await soacYearlyDDModel.updateOne(filter, { $set: { endDate: changeEnd } });
        this.updateEndDate(changeEnd);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description Function to add a new yearly data point
   */
  async addNewYearlyDataPoint() {
    try {
      const dateObj = new Date(this.currentYear, 0, 1);
      dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
      const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

      const doc = await soacYearlyDDModel.insertOne({
        name: this.name,
        startDate: this.startDate,
        endDate: this.endDate,
        totalDegreeDays: this.totalDegreeDays,
        lastInput: formattedDate,
      });
      console.log('Added new Year Data point');
      console.log('Document added: ' + doc);
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param tempDailyDDA The degree day data to store
   * @param date The date to store the data for
   * @description Function to add a new daily data point
   */
  async addNewDailyDataPoint(tempDailyDDA: number, date?: Date) {
    try {
      const dateObj = date ? new Date(date) : new Date();
      dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
      const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

      const doc = await soacDailyDDModel.insertOne({
        name: this.name,
        date: formattedDate,
        degreeDays: tempDailyDDA,
      });
      console.log('Added new Daily Data point');
      console.log('Document added: ' + doc);
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description Function to record degree day data per day
   * @param tempRunningDDA The degree day data to store
   */
  async addDDToYearly(name: string, tempRunningDDA: number, date?: Date) {
    // Push the new degree day data to the database
    try {
      const dateObj = date ? new Date(date) : new Date();
      dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
      const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

      // Creates doc if does not exist
      const exists = await soacYearlyDDModel.find({ name: this.name });
      if (exists.length === 0) await this.addNewYearlyDataPoint();

      await soacYearlyDDModel.updateOne(
        {
          name: name,
          startDate: {
            $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10),
          },
        },
        {
          $set: {
            totalDegreeDays: tempRunningDDA,
            lastInput: formattedDate,
          },
        },
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param name The name of the pest
   * @param tempDailyDDA The degree day data to store
   */
  async addDDToDaily(name: string, tempDailyDDA: number, date?: Date) {
    const dateObj = date ? new Date(date) : new Date();
    dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const dailyInput = {
      name: name,
      date: formattedDate,
      degreeDays: tempDailyDDA,
    };
    try {
      // Creates doc if does not exist
      const exists = await soacDailyDDModel.find(dailyInput);
      if (exists.length === 0) await this.addNewDailyDataPoint(tempDailyDDA, date);
      else if (exists[0].degreeDays < tempDailyDDA)
        await soacDailyDDModel.updateOne(dailyInput, { $set: { degreeDays: tempDailyDDA } });
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description Function to store the previous days data
   */
  async storePrevDD() {
    // Previous days data
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    const prevDay = today.setDate(today.getDate() - 1);

    let prevTotal = -1;

    try {
      // Filter model for specific date
      const dateString = new Date(prevDay).toISOString().slice(0, 10);
      const filter = {
        name: this.name,
        date: { $gte: dateString },
      };

      // Get the data from the database
      const dailyData = await soacDailyDDModel.find(filter).exec();
      if (dailyData.length === 0) throw new Error('No data found');

      // calculate previous total
      prevTotal = 0;
      for (let i = 0; i < dailyData.length; i++) {
        prevTotal += dailyData[i].degreeDays;
      }
    } catch (error) {
      throw error;
    }

    // Store and update the total seasonal data
    if (prevTotal === -1) {
      console.error('Error occurred in storePrevDD: No data found');
      throw new Error('Error occurred in totaling previous data');
    } else {
      // Store the data in the database
      try {
        const dateString = new Date(this.currentYear, 0, 1).toISOString().slice(0, 10);
        const filter = {
          name: this.name,
          startDate: {
            $gte: dateString,
          },
        };

        const yearlyData = await soacYearlyDDModel.find(filter);
        if (yearlyData.length === 0) throw new Error('No data found');

        // Update the data in the database
        yearlyData.updateOne({
          name: this.name,
          totalDegreeDays: prevTotal,
        });
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   * @description This function resets the degree days for the current year
   * @throws Error if there is an error resetting the degree days
   */
  async massResetYearlyDD(date: Date) {
    try {
      // await this.weatherStats.storeWeatherData(date); // Store the weather data
      await this.calculateDailyDegreeDays(date); // Calculate the daily degree days
      // await this.calculateRunningDegreeDays(); // Recalculate the running degree days
    } catch (error) {
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  /**
   * @description Function to calculate running degree days
   * @returns For testing purposes, returns 0 if successful and -1 if there was an error
   */
  async calculateRunningDegreeDays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    const localDateString =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    let foundToday = false;
    let tempTotalDegreeDays = 0;

    // Get Daily data here
    try {
      const filter = {
        name: this.name,
        date: { $gte: this.startDate },
      };

      const dailyData = await soacDailyDDModel.find(filter).exec();
      // if (dailyData.length === 0) throw new Error('No data found');

      if (dailyData.length !== 0) {
        // Tally total degree days
        for (let i = 0; i < dailyData.length; i++) {
          tempTotalDegreeDays += dailyData[i].degreeDays;

          // Fix the if. It is defaulting to reset
          // if (dailyData[i].date == today) {
          if (dailyData[i].date == localDateString) {
            this.updateDailyDegreeDays(dailyData[i].degreeDays);
            foundToday = true;
          }
        }

        if (!foundToday) this.resetDailyDegreeDays();

        if (this.getTotalDegreeDays() < tempTotalDegreeDays || this.getTotalDegreeDays() !== tempTotalDegreeDays) {
          await this.addDDToYearly(this.name, tempTotalDegreeDays); // Assign tempRunningDDA to the totalDegreeDays
        }

        // Store the data
        this.updateTotalDegreeDays(tempTotalDegreeDays);
      }
    } catch (error) {
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  /**
   *
   * @description Function to calculate the daily degree days
   *  (Low + High)
   *  ------------  - Base Temp
   *       2
   */
  async calculateDailyDegreeDays(date?: Date) {
    // Pull new weather data
    const normalizedDate = date ? new Date(date) : new Date(); // Use passed date or current date
    normalizedDate.setHours(0, 0, 0, 0); // Normalize to local midnight
    normalizedDate.toISOString().slice(0, 10);

    try {
      await this.weatherStats.storeWeatherData(date); // Store the weather data
    } catch (error) {
      console.error('Error occurred in calculateDailyDegreeDays:', error);
      throw error; // Rethrow the error to be handled by the caller
    }
    this.tempDayLow = this.weatherStats.getLowTemp();
    this.tempDayHigh = this.weatherStats.getHighTemp();
    this.updateDailyDegreeDays(Math.max((this.tempDayLow + this.tempDayHigh) / 2 - this.baseTemp, 0));
    if (this.dailyDegreeDays > 0) {
      try {
        await this.addDDToDaily(this.name, this.dailyDegreeDays, date); // Add to daily DD
        await this.addDDToYearly(this.name, this.dailyDegreeDays, date); // Add to running DD total
      } catch (error) {
        throw error; // Rethrow the error to be handled by the caller
      }
    }
  }

  /**
   *
   * @returns relevant data
   */
  toJSON() {
    return {
      name: this.name,
      baseTemp: this.baseTemp,
      maxTemp: this.maxTemp,
      thresholds: this.thresholds,
      currentYear: this.currentYear,
      dailyDegreeDays: this.dailyDegreeDays,
      totalDegreeDays: this.totalDegreeDays,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }
}
