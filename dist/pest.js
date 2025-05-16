/**
 * @description Class to represent a pest
 */
export class Pest {
    currentYear = new Date().getFullYear();
    name;
    baseTemp;
    maxTemp;
    thresholds;
    dailyDegreeDays = 0;
    totalDegreeDays = 0;
    startDate = "";
    endDate = "";
    constructor(name, base) {
        this.name = name;
        this.baseTemp = base;
    }
    updateDailyDegreeDays(dd) {
        this.dailyDegreeDays = dd;
    }
    updateTotalDegreeDays(dd) {
        this.totalDegreeDays = dd;
    }
    updateStartDate(date) {
        this.startDate = date;
    }
    updateEndDate(date) {
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
    async calculateTotalDegreeDays(model) {
        const today = new Date().toISOString().slice(0, 10);
        let foundToday = false;
        let tempTotalDegreeDays = 0;
        // Get Daily data here
        try {
            const filter = {
                name: this.name,
                date: { $gte: this.startDate },
            };
            const dailyData = await model.find(filter).exec();
            if (dailyData.length === 0)
                throw new Error("No data found");
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
                await this.storeDayDD(this.name, tempTotalDegreeDays, model); // Assign tempRunningDDA to the totalDegreeDays
            }
            // Store the data
            this.updateTotalDegreeDays(tempTotalDegreeDays);
        }
        catch (error) {
            console.error("Error occurred getting daily data:", error);
            throw new Error("Error occurred in getting daily data");
        }
    }
    /**
     * @description Function to get the year data from the database
     * @returns The year data from the database
     */
    async getYearData(model) {
        try {
            const filter = {
                name: this.name,
                startDate: { $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10) },
            };
            const data = await model.find(filter);
            if (data.length === 0)
                throw new Error("No data found");
            this.updateStartDate(data[0].startDate);
            this.updateEndDate(data[0].endDate);
            this.updateTotalDegreeDays(data[0].totalDegreeDays);
        }
        catch (error) {
            console.error("Error occurred in getYearData:", error);
            throw new Error("Error occurred in getDates");
        }
    }
    /**
     *
     * @param name
     * @param changeStart
     * @param changeEnd
     * @returns
     */
    async storeNewDate(model, changeStart, changeEnd) {
        try {
            const filter = {
                name: this.name,
                startDate: { $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10) },
            };
            if (changeStart != null && changeEnd != null) {
                await model.updateMany(filter, { $set: { startDate: changeStart, endDate: changeEnd } });
                this.updateStartDate(changeStart);
                this.updateEndDate(changeEnd);
            }
            else if (changeStart != null) {
                await model.updateOne(filter, { $set: { startDate: changeStart } });
                this.updateStartDate(changeStart);
            }
            else if (changeEnd != null) {
                await model.updateOne(filter, { $set: { endDate: changeEnd } });
                this.updateEndDate(changeEnd);
            }
        }
        catch (error) {
            console.error("Error occurred in storeNewDate:", error);
            throw new Error("Error occurred in storeNewDate");
        }
    }
    /**
     * @description Function to record degree day data per day
     * @param tempRunningDDA The degree day data to store
     */
    async storeDayDD(name, tempRunningDDA, model) {
        // Push the new degree day data to the database
        try {
            await model.updateOne({ name: name, startDate: { $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10) } }, { $set: { totalDegreeDays: tempRunningDDA, lastInput: new Date().toISOString().slice(0, 10) } });
        }
        catch (error) {
            console.error("Error occurred in storeDayDD:", error);
            throw new Error("Error occurred is storeDayDD");
        }
    }
    /**
     * @description Function to store the previous days data
     */
    async storePrevDD(dailyModel, yearlyModel) {
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
            const dailyData = await dailyModel.find(filter).exec();
            if (dailyData.length === 0)
                throw new Error("No data found");
            // calculate previous total
            prevTotal = 0;
            for (let i = 0; i < dailyData.length; i++) {
                prevTotal += dailyData[i].degreeDays;
            }
        }
        catch (error) {
            console.error("Error occurred in storePrevDD:", error);
            throw new Error("Error occurred in totaling previous data");
        }
        // Store and update the total seasonal data
        if (prevTotal === -1) {
            console.error("Error occurred in storePrevDD: No data found");
            throw new Error("Error occurred in totaling previous data");
        }
        else {
            // Store the data in the database
            try {
                const filter = {
                    name: this.name,
                    startDate: { $gte: new Date(`${this.currentYear}-01-01`).toISOString().slice(0, 10) },
                };
                const yearlyData = await yearlyModel.find(filter);
                if (yearlyData.length === 0)
                    throw new Error("No data found");
                // Update the data in the database
                yearlyData.updateOne({ name: this.name, totalDegreeDays: prevTotal });
            }
            catch (error) {
                console.error("Error occurred in storePrevDD:", error);
                throw new Error("Error occurred in storing previous data");
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
