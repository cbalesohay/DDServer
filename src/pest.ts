import { WeatherStats } from './weatherStats.js';
import soacDailyDDModel from './SoacDailyDD.js';
import soacYearlyDDModel from './SoacYearlyDD.js';
import soacTotalDDModel from './SoacTotalDD.js';

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
  private startDate: string | Date = '';
  private endDate: string | Date = '';
  private tempDayLow: number = 0;
  private tempDayHigh: number = 0;
  private weatherStats: WeatherStats = new WeatherStats();

  constructor(name: string, base: number) {
    this.name = name;
    this.baseTemp = base;
  }

  updateDailyDegreeDays(dd: number) {
    this.dailyDegreeDays = dd;
  }

  updateTotalDegreeDays(dd: number) {
    this.totalDegreeDays = dd;
  }

  updateStartDate(date: string | Date) {
    this.startDate = date;
  }

  updateEndDate(date: string | Date) {
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
   * @description Function to calculate running degree days
   * @returns For testing purposes, returns 0 if successful and -1 if there was an error
   */
  // async calculateRunningDegreeDays(modelDaily: any, modelYearly: any) {
  async calculateRunningDegreeDays() {
    const today = new Date().toISOString().slice(0, 10);
    let foundToday = false;
    let tempTotalDegreeDays = 0;

    // Get Daily data here
    try {
      const filter = {
        name: this.name,
        date: { $gte: this.startDate },
      };

      // const dailyData = await modelDaily.find(filter).exec();
      const dailyData = await soacDailyDDModel.find(filter).exec();
      if (dailyData.length === 0) throw new Error('No data found');

      // // Tally total degree days
      for (let i = 0; i < dailyData.length; i++) {
        tempTotalDegreeDays += dailyData[i].degreeDays;

        // Fix the if. It is defaulting to reset
        if (dailyData[i].date == today) {
          this.updateDailyDegreeDays(dailyData[i].degreeDays);
          foundToday = true;
        }
      }

      if (!foundToday) {
        this.resetDailyDegreeDays();
      }

      if (this.getTotalDegreeDays() < tempTotalDegreeDays || this.getTotalDegreeDays() !== tempTotalDegreeDays) {
        // await this.addDDToYearly(this.name, tempTotalDegreeDays, modelYearly); // Assign tempRunningDDA to the totalDegreeDays
        // await this.addDDToYearly(this.name, tempTotalDegreeDays, soacYearlyDDModel); // Assign tempRunningDDA to the totalDegreeDays
        await this.addDDToYearly(this.name, tempTotalDegreeDays); // Assign tempRunningDDA to the totalDegreeDays
      }

      // Store the data
      this.updateTotalDegreeDays(tempTotalDegreeDays);
    } catch (error) {
      console.error('Error occurred getting daily data:', error);
      throw new Error('Error occurred in getting daily data');
    }
  }

  /**
   * @description Function to get the year data from the database
   * @returns The year data from the database
   */
  // async getYearData(modelYearly: any) {
  async getYearData() {
    try {
      const filter = {
        name: this.name,
        startDate: {
          $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10),
        },
      };

      const data = await soacYearlyDDModel.find(filter);
      if (data.length === 0) throw new Error('No data found');

      this.updateStartDate(data[0].startDate);
      this.updateEndDate(data[0].endDate);
      this.updateTotalDegreeDays(data[0].totalDegreeDays);
    } catch (error) {
      console.error('Error occurred in getYearData:', error);
      throw new Error('Error occurred in getDates');
    }
  }

  /**
   *
   * @param name
   * @param changeStart
   * @param changeEnd
   * @returns
   */
  // async storeNewDate(modelYearly: any, changeStart: string | Date | null, changeEnd: string | Date | null) {
  async storeNewDate(changeStart: string | Date | null, changeEnd: string | Date | null) {
    try {
      const filter = {
        name: this.name,
        startDate: {
          $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10),
        },
      };
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
      console.error('Error occurred in storeNewDate:', error);
      throw new Error('Error occurred in storeNewDate');
    }
  }

  /**
   * @description Function to record degree day data per day
   * @param tempRunningDDA The degree day data to store
   */
  // async addDDToYearly(name: string, tempRunningDDA: number, modelYearly: any) {
  async addDDToYearly(name: string, tempRunningDDA: number) {
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
            totalDegreeDays: tempRunningDDA,
            lastInput: new Date().toISOString().slice(0, 10),
          },
        },
      );
    } catch (error) {
      console.error('Error occurred in storeDayDD:', error);
      throw new Error('Error occurred is storeDayDD');
    }
  }

  /**
   *
   * @param name The name of the pest
   * @param tempDailyDDA The degree day data to store
   * @param modelDaily The model for the daily DD data
   */
  // async addDDToDaily(name: string, tempDailyDDA: number, modelDaily: any) {
  async addDDToDaily(name: string, tempDailyDDA: number) {
    const dailyInput = {
      name: name,
      date: new Date().toISOString().slice(0, 10),
      degreeDays: tempDailyDDA,
    };
    try {
      if (!(await soacDailyDDModel.findOne(dailyInput))) await soacDailyDDModel.updateOne(dailyInput);
    } catch (error) {}
  }

  /**
   * @description Function to store the previous days data
   */
  // async storePrevDD(modelDaily: any, modelYearly: any) {
  async storePrevDD() {
    // Previous days data
    const today = new Date();
    const prevDay = today.setDate(today.getDate() - 1);

    let prevTotal = -1;

    try {
      // Filter model for specific date
      const filter = {
        name: this.name,
        date: { $gte: new Date(prevDay).toISOString().slice(0, 10) },
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
      console.error('Error occurred in storePrevDD:', error);
      throw new Error('Error occurred in totaling previous data');
    }

    // Store and update the total seasonal data
    if (prevTotal === -1) {
      console.error('Error occurred in storePrevDD: No data found');
      throw new Error('Error occurred in totaling previous data');
    } else {
      // Store the data in the database
      try {
        const filter = {
          name: this.name,
          startDate: {
            $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10),
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
        console.error('Error occurred in storePrevDD:', error);
        throw new Error('Error occurred in storing previous data');
      }
    }
  }

  /**
   * @description This function resets the degree days for the current year
   * @param modelYearly The model for the yearly DD data
   * @param modelDaily The model for the daily DD data
   * @param modelTotal The model for the total soac data from sensors
   * @throws Error if there is an error resetting the degree days
   */
  // async massResetYearlyDD(modelYearly: any, modelDaily: any, modelTotal: any) {
  async massResetYearlyDD() {
    try {
      const filter = {
        name: this.name,
        startDate: {
          $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10),
        },
      };
      await soacDailyDDModel.deleteMany({ name: this.name }); // Reset the daily data for this.name
      await soacYearlyDDModel.updateOne(filter, {
        $set: { totalDegreeDays: 0 },
      }); // Update the yearly data for this.name
      this.updateTotalDegreeDays(0); // Update the total degree days for this.name

      // Calculate the daily degree days from modelTotal

      // // Get the total daily data
      // const filterTotal = await modelTotal.find({
      //   name: this.name,
      //   date: {
      //     $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10),
      //   },
      // });

      // Recalculate the daily degree days
      // for (let i = 0; i < modelTotal.length; i++) {
      //   const dailyDD = filterTotal[i].degreeDays;
      //   const date = filterTotal[i].date;

      //   await modelDaily.updateOne({ name: this.name, date: date }, { $set: { degreeDays: dailyDD } }); // Store the data
      // }

      // Recalculate the total degree days
      // await this.calculateRunningDegreeDays(modelDaily, modelYearly); // Recalculate the total degree days
      await this.calculateRunningDegreeDays(); // Recalculate the total degree days
    } catch (error) {
      console.error('Error occurred in massResetYearlyDD:', error);
      throw new Error('Error occurred in massResetYearlyDD');
    }
  }

  /**
   *
   * @param modelTotal The model for the total soac data from sensors
   * @param date The date to calculate the degree days for
   * @description Function to calculate the daily degree days
   */
  // async calculateDailyDegreeDays(modelTotal: any, date: Date) {
  async calculateDailyDegreeDays(date: Date) {
    // this.weatherStats.storeWeatherData(modelTotal, date);
    this.weatherStats.storeWeatherData(date);
    this.tempDayLow = this.weatherStats.getLowTemp();
    this.tempDayHigh = this.weatherStats.getHighTemp();
    // (Low + High)
    // ------------  - Base Temp
    //      2
    this.dailyDegreeDays = (this.tempDayLow + this.tempDayHigh) / 2 - this.baseTemp;
    this.dailyDegreeDays = Math.max(this.dailyDegreeDays, 0);
    try {
      // await this.addDDToYearly(this.name, this.dailyDegreeDays, modelTotal);
      await this.addDDToYearly(this.name, this.dailyDegreeDays);
    } catch (error) {}
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
