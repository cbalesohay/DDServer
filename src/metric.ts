export class Metric {
  name: string;
  baseTemp: number;
  maxTemp?: number;

  thresholds?: {
    peakMothFlight?: number | undefined;
    firstHatch?: number | undefined;
    firstFlight?: number | undefined;
    firstApplication?: number;
    firstSpray?: number;
    infectionPhase?: number;
    ddAfterDate?: string;
  };

  dailyDegreeDays: number = 0;
  totalDegreeDays: number = 0;
  startDate: string | Date = "";
  endDate: string | Date = "";

  constructor(name: string, base: number) {
    this.name = name;
    this.baseTemp = base;
  }

  updateDates(startDate: string | Date, endDate: string | Date) {
    this.startDate = startDate;
    this.endDate = endDate;
  }

  updateDailyDegreeDays(dd: number) {
    this.dailyDegreeDays = dd;
    // this.totalDegreeDays += dd;
  }

  updateTotalDegreeDays(dd: number) {
    this.totalDegreeDays = dd;
  }

  resetDailyDegreeDays() {
    this.dailyDegreeDays = 0;
  }
}
