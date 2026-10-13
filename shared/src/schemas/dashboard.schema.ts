import { z } from 'zod';

export const chartPeriod = z.enum(['1d', '3d', '7d', '30d', '1y']).default('7d');

export type ChartPeriod = z.infer<typeof chartPeriod>;

export const chartFilterSchema = z.object({
  period: chartPeriod,
});
