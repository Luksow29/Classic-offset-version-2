export interface DataPoint {
  date: string;
  value: number;
}

export interface ForecastResult {
  historical: DataPoint[];
  forecast: DataPoint[];
  trend: 'up' | 'down' | 'stable';
  growthRate: number;
}

/**
 * Calculates a linear regression trend and forecasts future points.
 * @param data Array of historical data points sorted by date
 * @param periodsToForecast Number of future periods (months) to predict
 */
export function calculateForecast(data: DataPoint[], periodsToForecast: number = 3): ForecastResult {
  if (data.length < 2) {
    return {
      historical: data,
      forecast: [],
      trend: 'stable',
      growthRate: 0
    };
  }

  // Convert dates to indices (0, 1, 2...) for regression
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  data.forEach((point, i) => {
    const x = i;
    const y = point.value;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  // Calculate slope (m) and intercept (b)
  // m = (n*sumXY - sumX*sumY) / (n*sumXX - sumX*sumX)
  // b = (sumY - m*sumX) / n
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate forecast points
  const forecast: DataPoint[] = [];
  const lastDate = new Date(data[data.length - 1].date);

  for (let i = 1; i <= periodsToForecast; i++) {
    const nextIndex = n - 1 + i;
    const predictedValue = Math.max(0, slope * nextIndex + intercept); // Ensure no negative revenue
    
    // Increment month
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + i);
    
    forecast.push({
      date: nextDate.toISOString().slice(0, 7), // YYYY-MM
      value: Math.round(predictedValue)
    });
  }

  // Determine trend and growth rate
  const startValue = slope * 0 + intercept;
  const endValue = slope * (n - 1) + intercept;
  const growthRate = startValue !== 0 ? ((endValue - startValue) / startValue) * 100 : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (growthRate > 2) trend = 'up';
  else if (growthRate < -2) trend = 'down';

  return {
    historical: data,
    forecast,
    trend,
    growthRate
  };
}
