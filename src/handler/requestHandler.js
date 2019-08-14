const env = require('../../config/env');
const logger = require('../../config/logger');
const CafService = require('../service/customerAttributeService');
const BrazeAxiosService = require('../service/brazeAxiosService');

const cafService = new CafService();
const brazeAxiosService = new BrazeAxiosService();

// Push to the braze api
const pushToBraze = (documents, iBatch) => {
  logger.info(`(Repository/src/handler/requestHandler.js) # BATCH: ${iBatch} loadToBraze entered with total documents : ${documents.length} `);
  const transactions = [];
  for (let iBrazeThread = 0; iBrazeThread < Math.ceil(documents.length / env.iBrazeBatchSize); iBrazeThread++) {
    const brazePayLoad = documents.slice(iBrazeThread * env.iBrazeBatchSize, iBrazeThread * env.iBrazeBatchSize + env.iBrazeBatchSize);
    transactions.push(brazeAxiosService.upsertUserBatchToBraze(brazePayLoad, iBatch, iBrazeThread, 1));
  }
  return transactions;
};

// Add aliases to Braze
async function aliasesPushToBraze(fromDate, toDate) {
  // Gets the total count for date range
  const totalCount = await cafService.getCount(fromDate, toDate).catch(
    (err) => {
      logger.error('could not get the count of real time', err);
      return Promise.reject(err);
    },
  );
  logger.info('Total Customer Updates to be pushed to Braze: ', totalCount);
  if (totalCount < 1) {
    logger.info('Did not find any records to push to braze for this date', totalCount);
    return Promise.reject(new Error('No records for this date'));
  }
  if (totalCount > env.maxAutoProcessCustomerUpdates) {
    logger.info(`Found more than ${env.maxAutoProcessCustomerUpdates} customer updates`);
    return Promise.reject(new Error('Too Many Customers Updated for this date, please run Manually'));
  }

  // Iterate over the limit sequentially for parallel execution
  for (let iBatch = 0; iBatch < totalCount / env.maxProcessedRecord; iBatch++) {
    let status = 'Success';
    const startTs = new Date().getTime();

    // Parallel promises are created here
    const nextBatch = ((totalCount - iBatch * env.maxProcessedRecord) > env.maxProcessedRecord) ? env.maxProcessedRecord : (totalCount - iBatch * env.maxProcessedRecord);

    // eslint-disable-next-line no-await-in-loop
    const emailAliases = await cafService.getEmailAliases(iBatch * env.maxProcessedRecord, nextBatch, fromDate, toDate).catch(
      (dbErr) => {
        // Here the batch is failed. we log it and move to the next batch
        logger.error('Error while executing this batch', dbErr);
        status = 'Db error- Failed';
      },
    );

    // if the promises are available push to braze
    if (emailAliases) {
      logger.info('size of the records from the db', emailAliases.length);
      const promises = pushToBraze(emailAliases, iBatch);
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(promises).catch(
        (brazeErr) => {
          logger.error('Push to Braze failed', brazeErr);
          status = 'Push to Braze - Failed';
        },
      );
    }
    const endTs = new Date().getTime();
    logger.info('Batch ', iBatch, ' from record ', iBatch * env.maxProcessedRecord, ' to ', nextBatch, status, ' in ', (endTs - startTs), 'milliseconds');
  }
  return Promise.resolve('Push to Braze Complete');
}
module.exports = {aliasesPushToBraze};
