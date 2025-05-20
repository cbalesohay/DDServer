export class DataProcessor {
  constructor(
    private device: number,
    private Id: number,
    private soacTotalDDModel: any,
  ) {}

  async dataRangeMassReset(startDate: Date, metrics: Record<string, any>) {
    const today = new Date(); // Current date
    const current = new Date(startDate); // Current date for the loop
    // Reset the data
    try {
      // Might be able to use storePrevDD here
      while (current < today) {
        const nextDay = new Date(current);
        nextDay.setDate(current.getDate() + 1);

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
        if (!soacTotalDD || soacTotalDD.length === 0) {
          console.warn('No data found for the given date range');
        } else {
          // Get metric data
          for (const name of Object.keys(metrics)) {
            await metrics[name].massResetYearlyDD(soacTotalDD, current);
          }
        }

        // Update the current date
        current.setDate(current.getDate() + 1);
      }

      const year = new Date(startDate).getFullYear(); // Convert to year

      // Log the request
      console.log('------------------------------');
      console.log('Re-Calculation Made');
      console.log('Year:       ' + year);
      console.log('------------------------------');
    } catch (error) {}
  }
}
