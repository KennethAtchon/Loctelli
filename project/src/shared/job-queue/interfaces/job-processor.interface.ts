import { JobData } from './job-data.interface';

export interface JobProcessor {
  process(data: JobData): Promise<any>;
}