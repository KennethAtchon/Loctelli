export class JobResultDto {
  jobId: string;
  status:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'not_found'
    | 'error';
  progress?: number;
  result?: any;
  error?: any;
  createdAt?: Date;
  completedAt?: Date;
}
