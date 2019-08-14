#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const env = require('./config/env');
const logger = require('./config/logger');
const handler = require('./src/handler/requestHandler');
const mongoConnect = require('./connection-provider');

require('dotenv').config();
require('app-module-path').addPath(path.join(__dirname, '/src'));

// Add aliases to external_id
program.command('aliases')
  .alias('al')
  .arguments('[fromDate] [toDate]')
  .description('Add aliases to external_id')
  .action(async (fromDate, toDate) => {
    let _fromDate = null;
    if (fromDate === null || fromDate === undefined) {
      _fromDate = new Date().toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } else _fromDate = fromDate;

    logger.info(`From Date : ${_fromDate}`);
    mongoConnect(env.mongo.mongoURL, env.mongo.options);
    await handler.aliasesPushToBraze(_fromDate, toDate).catch(
      (err) => {
        logger.info('Error while processing the data', err);
        process.exit();
      },
    );
    process.exit();
  });

program.parse(process.argv);