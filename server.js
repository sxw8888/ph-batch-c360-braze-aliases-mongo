#!/usr/bin/env node

const program = require('commander');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const logger = require('./config/logger');
const handler = require('./src/handler/requestHandler');
const mongoConnect = require('./connection-provider');

require('dotenv').config();
require('app-module-path').addPath(path.join(__dirname, '/src'));

const testFolder = './files_to_purge/';

// Command to Real time push
program.command('realtimePush')
  .alias('real')
  .arguments('[fromDate] [toDate]')
  .description('Real Time Pipeline ')
  .action(async (fromDate, toDate) => {
    let _fromDate = null;
    if (fromDate === null || fromDate === undefined) {
      _fromDate = new Date().toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } else _fromDate = fromDate;

    logger.info(`From Data : ${_fromDate}`);
    mongoConnect(env.mongo.mongoURL, env.mongo.options);
    await handler.realTimePushToBraze(_fromDate, toDate).catch(
      (err) => {
        logger.info('Error while processing the data', err);
        process.exit();
      },
    );
    process.exit();
  });

// manualEmailSync
program.command('manualSyncEmailOptout')
  .alias('manualopt')
  .arguments('<skip> <total> <fromDate> [toDate]')
  .description('manual sales force email opt out sync to braze ')
  .action(async (skip, total, fromDate, toDate) => {
    logger.info('Sales force opt out');
    mongoConnect(env.mongo.mongoURL, env.mongo.options);
    await handler.manualEmailSync(skip, total, fromDate, toDate).catch(
      (err) => {
        logger.info('Error while processing the data', err);
        process.exit();
      },
    );
    process.exit();
  });

program.command('salesForceOpt')
  .alias('realopt')
  .arguments('<fromDate> [toDate]')
  .description('sales force email opt out sync to braze ')
  .action(async (fromDate, toDate) => {
    logger.info('Sales force opt out realtime');
    mongoConnect(env.mongo.mongoURL, env.mongo.options);
    await handler.saleForceEmailOptOutSync(fromDate, toDate).catch(
      (salesForceEmailOptOutError) => {
        logger.info('Error while processing the data', salesForceEmailOptOutError);
        process.exit();
      },
    );
    process.exit();
  });

// Command to Manual Push
program.command('manualPush')
  .alias('manual')
  .arguments('<skip> <limit> <fromDate> [toDate]')
  .description('Manual Push to Braze ')
  .action(async (skip, limit, fromDate, toDate) => {
    logger.info('Sales force opt out manual');
    mongoConnect(env.mongo.mongoURL, env.mongo.options);
    await handler.manualPushToBraze(skip, limit, fromDate, toDate).catch(
      (manualPushToBrazeError) => {
        logger.info('Error while processing the manual data', manualPushToBrazeError);
        process.exit();
      },
    );
    process.exit();
  });

program.command('syncToBrazeFromCSV')
  .alias('optcsv')
  .description('Sync to BRaze from CSV ')
  .action(async () => {
    const records = await handler.getDataFromCSV('Emails_opted_out.csv').catch(
      (err) => {
        logger.info('Error while processing the data', err);
      },
    );

    const status = await Promise.all(handler.emailCSVCustom(records)).catch((err) => {
      logger.error('Error while deleting from braze', err);
    });

    if (status) {
      logger.info('All records success');
    }

    process.exit();
  });

program.command('deleteUserByExternalIds')
  .alias('delbi')
  .description('Delete User By braze Id ')
  .action(async () => {
    logger.info('loading data.....');
    fs.readdir(testFolder, async (err, files) => {
      for (let i = 0; i < files.length; i++) {
        let message = 'success';
        // eslint-disable-next-line no-await-in-loop
        const records = await handler.getDataFromCSV(testFolder + files[i]).catch(
          (dataFromCSVError) => {
            logger.info('Error while processing the data', dataFromCSVError);
            message = 'failed';
          },
        );
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(handler.deleteFromBrazeByExternalId(records)).catch((deleteFromBrazeError) => {
          logger.error('Error while deleting from braze', deleteFromBrazeError);
          message = 'failed';
        });

        logger.info('file to purge', files[i], 'is', message);
      }

      process.exit();
    });
  });

program.parse(process.argv);
