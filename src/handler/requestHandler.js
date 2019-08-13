const csv = require('fast-csv');
const fs = require('fs');
const env = require('../../config/env');
const logger = require('../../config/logger');
const CafService = require('../service/customerAttributeService');
const BrazeAxiosService = require('../service/brazeAxiosService');
const SfEmailOptOutService = require('../service/salesForceEmailOptOutService');

const cafService = new CafService();
const brazeAxiosService = new BrazeAxiosService();
const sfEmailOptOutService = new SfEmailOptOutService();

// Push to the braze api
const pushToBraze = (documents, iBatch) => {
  logger.info(`(Repository/sync2braze.updateCustomerEmergencyCAF) # BATCH: ${iBatch} loadToBraze entered with total documents : ${documents.length} `);
  const transactions = [];
  for (let iBrazeThread = 0; iBrazeThread < Math.ceil(documents.length / env.iBrazeBatchSize); iBrazeThread++) {
    const brazePayLoad = documents.slice(iBrazeThread * env.iBrazeBatchSize, iBrazeThread * env.iBrazeBatchSize + env.iBrazeBatchSize);
    transactions.push(brazeAxiosService.upsertUserBatchToBraze(brazePayLoad, iBatch, iBrazeThread, 1));
  }
  return transactions;
};

// function pushToBraze(data) {
//   const promises = [];
//   for (let index = 0; index < data.length; index += env.iBrazeBatchSize) {
//     const myChunk = data.slice(index, index + env.iBrazeBatchSize);
//     promises.push(brazeAxiosService.postBraze(myChunk));
//   }
//   return promises;
// }

// Email Status Update to Braze
// function emailStatusUpdateToBraze(data) {
//   const promises = [];
//   for (let index = 0; index < data.length; index++) {
//     promises.push(brazeAxiosService.sendEmailStatus(data[index]));
//   }
//   return promises;
// }

function unSubscribeEmailPush(data) {
  const promises = [];
  for (let index = 0; index < data.length; index += env.iBrazeBatchSize) {
    const myChunk = data.slice(index, index + env.iBrazeBatchSize).map(element => element.email_address);
    promises.push(brazeAxiosService.unubscribeEmail(myChunk));
  }
  return promises;
}

function emailCSVCustom(data) {
  const promises = [];
  for (let index = 0; index < data.length; index++) {
    const req = {};
    req.email_address = data[index];
    req.email_subscribe = 'unsubscribed';
    promises.push(brazeAxiosService.sendEmailStatus(req));
  }
  return promises;
}


// Real Time push to Braze
async function realTimePushToBraze(fromDate, toDate) {
  // Gets the total count for date range
  const totalCount = await cafService.getCafAttributeCount(fromDate, toDate).catch(
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
  for (let iBatch = 0; iBatch < totalCount / env.maxProcessedRecord; iBatch++) { // totalCount / env.maxProcessedRecord
    let status = 'Success';
    const startTs = new Date().getTime();

    // Parallel promises are created here
    const nextBatch = ((totalCount - iBatch * env.maxProcessedRecord) > env.maxProcessedRecord) ? env.maxProcessedRecord : (totalCount - iBatch * env.maxProcessedRecord);
    // eslint-disable-next-line no-await-in-loop

    const cafAttrib = await cafService.getCafAggregate(iBatch * env.maxProcessedRecord, nextBatch, fromDate, toDate).catch(
      (dbErr) => {
        // Here the batch is failed. we log it and move to the next batch
        logger.error('Error while executing this batch', dbErr);
        status = 'Db error- Failed';
      },
    );

    // if the promises are available push to braze
    if (cafAttrib) {
      logger.info('size of the records from the db', cafAttrib.length);
      const promises = pushToBraze(cafAttrib, iBatch);
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

// manual push to braze with the skip, limit, and date.
async function manualPushToBraze(skip, limit, fromDate, toDate) {
  const startTs = new Date().getTime();
  let status = 'success';
  const start = parseInt(skip, 10);
  const max = parseInt(limit, 10);
  const cafAttrib = await cafService.getCafAggregate(start, max, fromDate, toDate).catch(
    (dbErr) => {
      logger.error('Error while executing this batch', dbErr);
      status = 'failed';
      return Promise.reject(dbErr);
    },
  );

  logger.info(cafAttrib.length);

  // push to braze
  if (cafAttrib) {
    await Promise.all(pushToBraze(cafAttrib)).catch(
      (brazeErr) => {
        logger.error('Push to Braze Failed', brazeErr);
        status = 'failed';
      },
    );
  }
  const endTs = new Date().getTime();
  logger.info('Batch ', 'from record ', skip, ' to ', (start + max), status, ' in ', (endTs - startTs), 'milliseconds');
  return Promise.resolve('Push to Braze Complete');
}


function getDataFromCSV(fileName) {
  return new Promise(((resolve, reject) => {
    let records = [];
    csv
      .fromPath(fileName)
      .on('data', (data) => {
        const obj = JSON.parse(data);
        records = records.concat(obj.external_id);
      })
      .on('err', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve(records);
      });
  }));
}


async function getDataFromJSON(filename) {
  const rawdata = fs.readFileSync(filename);
  const object = JSON.parse(rawdata);
  return object;
}


function deleteFromBrazeByExternalId(data) {
  const promises = [];
  for (let index = 0; index < data.length; index += env.iBrazeBatchSize) {
    const myChunk = data.slice(index, index + env.iBrazeBatchSize);
    promises.push(brazeAxiosService.deleteFromBrazeByExternalId(myChunk));
  }
  return promises;
}


// manual push to braze with the skip, limit, and date.
async function manualEmailSync(skip, total, fromDate, toDate) {
  // const startTs = new Date().getTime();
  // const status = 'success';
  const start = parseInt(skip, 10);
  const totalCount = parseInt(total, 10);

  logger.info('Total Count of Records to be pushed to Braze: ', totalCount);
  if (totalCount < 1) {
    logger.info('Did not find any records to push to braze for this date', totalCount);
    return Promise.reject(new Error('No records for this date'));
  }

  // Iterate over the limit sequentially for parallel execution
  for (let index = start; index < totalCount; index += env.maxProcessedRecord) {
    let toRange = env.maxProcessedRecord;
    if (toRange > totalCount) {
      toRange = totalCount - index;
    }
    let status = 'Success';
    const startTs = new Date().getTime();

    // Parallel promises are created here
    // eslint-disable-next-line no-await-in-loop
    const salesForceEmails = await sfEmailOptOutService.getSalesForceEmailOptOut(index, toRange, fromDate, toDate).catch(
      (dbErr) => {
        // Here the batch is failed. we log it and move to the next batch
        logger.error('Error while executing this batch', dbErr);
        status = 'Db error- Failed';
      },
    );
    // if the promises are available push to braze
    if (salesForceEmails) {
      logger.info('size of the records from the db', salesForceEmails.length);
      const promises = unSubscribeEmailPush(salesForceEmails);
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(promises).catch(
        (brazeErr) => {
          logger.error('Push to Braze failed', brazeErr);
          status = 'Push to Braze - Failed';
        },
      );
    }
    const endTs = new Date().getTime();
    logger.info('Batch ', Math.floor(index / env.maxProcessedRecord), ' from record ', index, ' to ', (index + toRange), status, ' in ', (endTs - startTs), 'milliseconds');
  }
  return Promise.resolve('Push to Braze Complete');
}


// Email Opt out To Braze from SaleForce
async function saleForceEmailOptOutSync(fromDate, toDate) {
  // Gets the total count for date range


  const totalCount = await sfEmailOptOutService.getSaleForceEmailCountForDate(fromDate, toDate).catch(
    (err) => {
      logger.error('could not get the count of real time', err);
      return Promise.reject(err);
    },
  );
  logger.info('Total Count of Records to be pushed to Braze: ', totalCount);
  if (totalCount < 1) {
    logger.info('Did not find any records to push to braze for this date', totalCount);
    return Promise.reject(new Error('No records for this date'));
  }

  // Iterate over the limit sequentially for parallel execution
  let counter = 1;
  for (let index = 0; index < totalCount; index += env.maxProcessedRecord) {
    let toRange = env.maxProcessedRecord;
    if (toRange > totalCount) {
      toRange = totalCount - index;
    }
    let status = 'Success';
    const startTs = new Date().getTime();

    // Parallel promises are created here
    // eslint-disable-next-line no-await-in-loop
    const salesForceEmails = await sfEmailOptOutService.getSalesForceEmailOptOut(index, toRange, fromDate, toDate).catch(
      (dbErr) => {
        // Here the batch is failed. we log it and move to the next batch
        logger.error('Error while executing this batch', dbErr);
        status = 'Db error- Failed';
      },
    );

    // if the promises are available push to braze
    if (salesForceEmails) {
      logger.info('size of the records from the db', salesForceEmails.length);
      const promises = unSubscribeEmailPush(salesForceEmails);
      logger.info(promises.length);
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(promises).catch(
        (brazeErr) => {
          logger.error('Push to Braze failed', brazeErr);
          status = 'Push to Braze - Failed';
        },
      );
    }
    const endTs = new Date().getTime();
    logger.info('Batch ', counter, ' from record ', index, ' to ', (index + toRange), status, ' in ', (endTs - startTs), 'milliseconds');
    counter++;
  }
  return Promise.resolve('Push to Braze Complete');
}


module.exports = {
  realTimePushToBraze,
  manualPushToBraze,
  getDataFromCSV,
  saleForceEmailOptOutSync,
  manualEmailSync,
  emailCSVCustom,
  getDataFromJSON,
  deleteFromBrazeByExternalId,
};
