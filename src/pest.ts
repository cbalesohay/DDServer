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
  private currDayDDTotal: number = 0;
  private startDate: Date = new Date(this.currentYear ?? new Date().getFullYear(), 0, 1);
  private endDate: Date = new Date(this.currentYear ?? new Date().getFullYear(), 11, 31);
  private tempDayLow: number = 0;
  private tempDayHigh: number = 0;

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

  updateTempDayLow(temp: number) {
    this.tempDayLow = temp;
  }

  updateTempDayHigh(temp: number) {
    this.tempDayHigh = temp;
  }

  updatecurrDayDDTotal(dd: number) {
    this.currDayDDTotal = dd;
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
    const dateObj = new Date(this.currentYear, 0, 1);
    dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const filter = {
      name: this.name,
      startDate: {
        $gte: formattedDate,
      },
    };

    try {
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
    const dateObj = new Date(this.currentYear, 0, 1);
    dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    const filter = {
      name: this.name,
      startDate: {
        $gte: formattedDate,
      },
    };

    try {
      // Creates doc if does not exist
      const exists = await soacYearlyDDModel.find({ name: this.name });
      if (exists.length === 0) await this.addNewYearlyDataPoint();
    } catch (error) {
      throw error;
    }

    if (changeStart != null && changeEnd != null) {
      try {
        await soacYearlyDDModel.updateMany(filter, {
          $set: { startDate: changeStart, endDate: changeEnd },
        });
      } catch (error) {
        console.error('Error occurred in storeNewDate for updateMany:', error);
      }
      this.updateStartDate(changeStart);
      this.updateEndDate(changeEnd);
    } else if (changeStart != null) {
      try {
        await soacYearlyDDModel.updateOne(filter, {
          $set: { startDate: changeStart },
        });
      } catch (error) {
        console.error('Error occurred in storeNewDate for updateOne startDate:', error);
      }
      this.updateStartDate(changeStart);
    } else if (changeEnd != null) {
      try {
        await soacYearlyDDModel.updateOne(filter, { $set: { endDate: changeEnd } });
      } catch (error) {
        console.error('Error occurred in storeNewDate for updateOne endDate:', error);
      }
      this.updateEndDate(changeEnd);
    }
  }

  /**
   * @description Function to add a new yearly data point
   */
  async addNewYearlyDataPoint() {
    const dateObj = new Date(this.currentYear, 0, 1);
    dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    try {
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
    const dateObj = date ? new Date(date) : new Date();
    dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    try {
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
    const dateObj = date ? new Date(date) : new Date();
    dateObj.setHours(0, 0, 0, 0); // Normalize to midnight
    const formattedDate = dateObj.toISOString().slice(0, 10); // "YYYY-MM-DD"

    try {
      // Creates doc if does not exist
      const exists = await soacYearlyDDModel.find({ name: this.name });
      if (exists.length === 0) await this.addNewYearlyDataPoint();
    } catch (error) {
      console.error('Error occurred in addDDToYearly for existing data:', error);
    }

    // Push the new degree day data to the database
    try {
      await soacYearlyDDModel.updateOne(
        {
          name: name,
          startDate: {
            $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10),
          },
        },
        {
          $set: {
            totalDegreeDays: tempRunningDDA - this.currDayDDTotal,
            lastInput: formattedDate,
          },
        },
      );
    } catch (error) {
      console.error('Error occurred in addDDToYearly for updateOne:', error);
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
      else if (exists[0].degreeDays < tempDailyDDA) {
        this.updatecurrDayDDTotal(exists[0].degreeDays);
        try {
          await soacDailyDDModel.updateOne(dailyInput, { $set: { degreeDays: tempDailyDDA } });
        } catch (error) {
          console.error('Error occurred in addDDToDaily for updateOne:', error);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * @description Function to store the previous days data
   */
  async storePrevDD() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight
    const prevDay = today.setDate(today.getDate() - 1);

    let prevTotal = -1;

    // Filter model for specific date
    const dateString = new Date(prevDay).toISOString().slice(0, 10);
    const filter = {
      name: this.name,
      date: { $gte: dateString },
    };

    try {
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
      const dateString = new Date(this.currentYear, 0, 1).toISOString().slice(0, 10);
      const filter = {
        name: this.name,
        startDate: {
          $gte: dateString,
        },
      };

      try {
        const yearlyData = await soacYearlyDDModel.find(filter);
        if (yearlyData.length === 0) throw new Error('No data found');

        try {
          // Update the data in the database
          yearlyData.updateOne({
            name: this.name,
            totalDegreeDays: prevTotal,
          });
        } catch (error) {
          console.error('Error occurred in storePrevDD for updateOne:', error);
        }
      } catch (error) {
        throw error;
      }
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
    const filter = {
      name: this.name,
      date: { $gte: this.startDate },
    };

    try {
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
          try {
            await this.addDDToYearly(this.name, tempTotalDegreeDays); // Assign tempRunningDDA to the totalDegreeDays
          } catch (error) {
            console.error('Error occurred in calculateRunningDegreeDays for addDDToYearly:', error);
          }
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

    this.updateDailyDegreeDays(Math.max((this.tempDayLow + this.tempDayHigh) / 2 - this.baseTemp, 0));
    if (this.dailyDegreeDays > 0) {
      try {
        await this.addDDToDaily(this.name, this.dailyDegreeDays, date); // Add to daily DD
      } catch (error) {
        console.error('Error occurred in calculateDailyDegreeDays for addDDToDaily:', error);
      }

      try {
        await this.addDDToYearly(this.name, this.dailyDegreeDays, date); // Add to running DD total
      } catch (error) {
        console.error('Error occurred in calculateDailyDegreeDays for addDDToYearly:', error);
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
