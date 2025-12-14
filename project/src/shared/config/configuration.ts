export default () => ({
  port: parseInt(process.env.PORT || '3000', 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10) || 0,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '180000', 10) || 3 * 60000, // 3 minutes default
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '100', 10) || 100,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d',
  },
  api: {
    key: process.env.API_KEY,
  },
  admin: {
    authCode: process.env.ADMIN_AUTH_CODE,
    defaultPassword: process.env.DEFAULT_ADMIN_PASSWORD,
  },
  cors: {
    origins: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : [
          'http://localhost:3000',
          'http://loctelli_frontend:3000',
          'http://frontend:3000',
          'http://loctelli.com',
        ],
  },
  // R2 Storage Configuration
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
    enabled: process.env.R2_ENABLED === 'true' || true,
  },
  // Twilio Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  // SMS Settings
  sms: {
    rateLimitPerMinute: parseInt(
      process.env.SMS_RATE_LIMIT_PER_MINUTE || '60',
      10,
    ),
    maxBatchSize: parseInt(process.env.SMS_MAX_BATCH_SIZE || '100', 10),
    retryAttempts: parseInt(process.env.SMS_RETRY_ATTEMPTS || '3', 10),
  },
  // Job Queue Settings
  jobQueue: {
    removeOnSuccess: parseInt(process.env.QUEUE_REMOVE_ON_SUCCESS || '10', 10),
    removeOnFailure: parseInt(process.env.QUEUE_REMOVE_ON_FAILURE || '50', 10),
    defaultRetries: parseInt(process.env.QUEUE_DEFAULT_RETRIES || '3', 10),
    maxConcurrency: parseInt(process.env.QUEUE_MAX_CONCURRENCY || '10', 10),
  },
});
