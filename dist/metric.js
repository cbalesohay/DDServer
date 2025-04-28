export class Metric {
    name;
    baseTemp;
    maxTemp;
    thresholds;
    dailyDegreeDays = 0;
    totalDegreeDays = 0;
    startDate = "";
    endDate = "";
    constructor(name, base, max) {
        this.name = name;
        this.baseTemp = base;
        this.maxTemp = max;
    }
    updateDates(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
    }
    updateDailyDegreeDays(dd) {
        this.dailyDegreeDays = dd;
        // this.totalDegreeDays += dd;
    }
    updateTotalDegreeDays(dd) {
        this.totalDegreeDays = dd;
    }
    resetDailyDegreeDays() {
        this.dailyDegreeDays = 0;
    }
}
