export class DataProcessor {
  constructor(
    private device: number,
    private Id: number,
    private soacTotalDDModel: any,
    private soacDailyDDModel: any,
    private soacYearlyDDModel: any,
  ) {}

  /**
   *
   * @param startDate The start date of the data to reset
   * @param metrics The metrics to reset
   * @description Function to reset the data for the given date range
   */
  async dataRangeMassReset(startDate: Date, metrics: Record<string, any>) {
    const today = new Date(); // Current date
    today.setHours(0, 0, 0, 0); // Set time to midnight

    let current = new Date(startDate); // Current date for the loop
    current.setHours(0, 0, 0, 0); // Set time to midnight
    try {
      // Might be able to use storePrevDD here
      while (current <= today) {
        console.log('Current:', current.toISOString());
        console.log('Today  :', today.toISOString());

        const nextDay = new Date(current.getTime());
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0); // Set time to midnight

        const query = {
          device: this.device,
          id: this.Id,
          time: {
            $gte: current.toISOString(),
            $lt: nextDay.toISOString(),
          },
        };

        // Fetch soacTotalDD and error handling
        const soacTotalDD = await this.soacTotalDDModel.find(query).exec();
        // if (!soacTotalDD || soacTotalDD.length === 0) throw new Error('No data found for the given date range');

        // Get metric data
        // for (const name of Object.keys(metrics)) {
        //   await metrics[name].calculateDailyDegreeDays(current);
        // }
        for (const name of Object.keys(metrics)) {
          await metrics[name].calculateDailyDegreeDays(new Date(current));
        }

        // Update the current date
        // current = new Date(current);
        current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        current.setHours(0, 0, 0, 0);
      }

      // Calculate the running total for each metric
      for (const name of Object.keys(metrics)) {
        await metrics[name].calculateRunningDegreeDays();
      }

      // Log the request
      console.log('------------------------------');
      console.log('Re-Calculation Made');
      console.log('Year:       ' + startDate.getFullYear());
      console.log('------------------------------');
    } catch (error) {
      throw error; // Rethrow the error to be handled by the caller
    }
  }

  /**
   *
   * @param name The name of the metric
   * @param startDate The start date of the data to reset
   * @description Function to reset the data from the given date range
   */
  async zeroOutYearlyData(name: string, startDate: Date) {
    try {
      const filter = {
        name: name,
        startDate: {
          $gte: new Date(`${startDate.getFullYear()}-01-01`).toISOString().slice(0, 10),
        },
      };
      await this.soacDailyDDModel.deleteMany({ name: name }); // Reset the daily data for this.name
      await this.soacYearlyDDModel.updateOne(filter, {
        $set: { totalDegreeDays: 0 },
      }); // Update the yearly data for this.name
    } catch (error) {}
  }

  /**
   *
   * @param today The date to fetch data for
   * @returns The fetched data
   * @description Function to fetch the total SAOC data for the given date
   */
  async fetchWeatherSaocData(today: Date) {
    const query = {
      device: 12,
      id: 171,
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
      const results = await this.soacTotalDDModel.find(query, projection).exec();

      // If no results found, throw an error
      // if (results.length === 0) {
      //   throw new Error('No data found in results');
      // }
      return results;
    } catch (error) {
      throw error; // Rethrow the error to be handled by the caller
    }
  }
}
