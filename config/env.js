const dotenv = require('dotenv');

dotenv.config();

const mongo = {
  mongoURL: process.env.MONGO_SERVER_CONNECTION,
  options: {
    useNewUrlParser: true,
    reconnectTries: Number.MAX_VALUE,
  },
};

module.exports = {
  node_env: process.env.node_env,
  mongo,
  maxProcessedRecord: parseInt(process.env.MAX_PROCESSED_RECORDS, 10),
  brazeApiKey: process.env.BRAZE_API_KEY,
  timeLapse: parseInt(process.env.DEFAULT_LOAD_DAYS, 10) * 24 * 60 * 60000,
  customerAttribCollection: process.env.CUSTOMER_ATTRIB_COLLECTION,
  brazeUrl: process.env.BRAZE_URL,
  iBrazeBatchSize: parseInt(process.env.BRAZE_BATCH_SIZE, 10),
  maxEmailSyncLimit: parseInt(process.env.MAX_EMAIL_SYNC_LIMIT, 10),
  dryRun: parseInt(process.env.DRY_RUN, 10),
  maxAutoProcessCustomerUpdates: parseInt(process.env.MAX_AUTO_PROCESS_CUSTOMERS_UPDATES, 10),
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS, 10),
};
