import { Pest } from "./pest.js";
import { WeatherStats } from "./weatherStats.js";

// Type check
export const metricNames = ["Western Cherry", "Leaf Rollers", "Codling Moth", "Apple Scab"] as const;
export type MetricName = (typeof metricNames)[number];
export interface StoredData {
  metrics: Record<MetricName, Pest>;
  weather: WeatherStats;
}

// Define the configuration for each metric
const metricConfig: Record<MetricName, { baseTemp: number; maxTemp?: number; firstFlightThresh?: number }> = {
  "Western Cherry": { baseTemp: 41, firstFlightThresh: 850 },
  "Leaf Rollers": { baseTemp: 41, maxTemp: 85 },
  "Codling Moth": { baseTemp: 50, maxTemp: 88 },
  "Apple Scab": { baseTemp: 32 },
};

/**
 *
 * @returns The data object for the metrics
 * @description Function to create the metric data and store it in the data object
 */
export function createMetricData(): Record<MetricName, Pest> {
  const data = {} as Record<MetricName, Pest>;

  for (const name of metricNames) {
    const config = metricConfig[name];
    const metric = new Pest(name, config.baseTemp);

    // Optioanl maxTemp param
    if (config.maxTemp !== undefined) metric.maxTemp = config.maxTemp;
    // Optional thresholds.firstFlight
    if (config.firstFlightThresh !== undefined && metric.thresholds) metric.thresholds.firstFlight = config.firstFlightThresh;

    data[name] = metric;
  }

  return data;
}
