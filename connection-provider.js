const mongoose = require('mongoose');
const logger = require('./config/logger');

const mongoConnect = (connectionString, connectionOptions, conf) => {
  mongoose.connect(connectionString, connectionOptions, conf).catch((err) => {
    logger.error('error while connecting to mongo DB', err);
    process.exit(1);
  });
};

module.exports = mongoConnect;
