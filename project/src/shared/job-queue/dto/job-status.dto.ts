export class JobStatusDto {
  jobId: string;
  type: string;
  status: string;
  progress?: number;
  createdAt?: Date;
  completedAt?: Date;
  error?: string;
}