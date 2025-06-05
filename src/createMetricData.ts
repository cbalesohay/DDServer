import { Pest } from "./pest.js";
import { WeatherStats } from "./weatherStats.js";

// Type check
export const metric_names = ["Western Cherry", "Leaf Rollers", "Codling Moth", "Apple Scab"] as const;
export type MetricName = (typeof metric_names)[number];
export interface StoredData {
  pests: Record<MetricName, Pest>;
  weather: WeatherStats;
}

// Define the configuration for each metric
const metricConfig: Record<MetricName, { base_temp: number; max_temp?: number; first_flight_thresh?: number }> = {
  "Western Cherry": { base_temp: 41, first_flight_thresh: 850 },
  "Leaf Rollers": { base_temp: 41, max_temp: 85 },
  "Codling Moth": { base_temp: 50, max_temp: 88 },
  "Apple Scab": { base_temp: 32 },
};

/**
 *
 * @returns The data object for the metrics
 * @description Function to create the metric data and store it in the data object
 */
export function createMetricData(): Record<MetricName, Pest> {
  const data = {} as Record<MetricName, Pest>;

  for (const name of metric_names) {
    const config = metricConfig[name];
    const metric = new Pest(name, config.base_temp);

    // Optioanl max_temp param
    if (config.max_temp !== undefined) metric.max_temp = config.max_temp;
    // Optional thresholds.firstFlight
    if (config.first_flight_thresh !== undefined && metric.thresholds) metric.thresholds.firstFlight = config.first_flight_thresh;

    data[name] = metric;
  }

  return data;
}
