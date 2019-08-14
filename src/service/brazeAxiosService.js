const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../config/logger');
const CafService = require('../service/customerAttributeService');

const cafService = new CafService();

class brazeAxiosService {
  constructor() {
    this.brazUrl = env.brazeUrl;
  }

  // create or update userprofile with custom attributes in braze
  async upsertUserBatchToBraze(customers, iBatch, iBrazeThread, iRetryAttempt) {
    const externalIds = customers.map(doc => doc.external_id);
    const previouslyUnProcessedCustomers = customers.filter(element => element.sent_to_braze === false).map(element => element.external_id);
    // eslint-disable-next-line no-param-reassign
    delete customers.sent_to_braze;
    const recursiveStack = {
      response: []
    };
    let results = [];
    logger.debug(`(Repository/sync2braze.upsertUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, Attempt ${iRetryAttempt}, inserting into braze # ${externalIds}, previouslyUnProcessedCustomers # ${previouslyUnProcessedCustomers} `);

    const payLoad = {
      api_key: env.brazeApiKey,
      user_aliases: customers,
    };
    const config = {
      responseType: 'json',
    };
    const url = `${env.brazeUrl}/users/alias/new`;

    this.responseFromBRAZE = await axios.post(url, payLoad, config)
      .catch(async (error) => {
        logger.error(`(Repository/sync2braze.upsertUserBatch) # BATCH ${iBatch} THREAD ${iBrazeThread}, Attempt ${iRetryAttempt}, Error inserting into braze # ${error} ########### ${externalIds}`);
        if (iRetryAttempt < env.retryAttempts) {
          results = await this.upsertUserBatchToBraze(customers, iBatch, iBrazeThread, iRetryAttempt + 1);
        } else {
          results = await cafService.markFailedUserBatchToBraze(externalIds, iBatch, iBrazeThread, iRetryAttempt);
        }
        recursiveStack.response.push({
          status: error.response.status,
          message: ` BATCH ${iBatch} THREAD ${iBrazeThread}, Attempt ${iRetryAttempt}, ${error.response.data.message}`
        });
        results.response.forEach(element => recursiveStack.response.push({
          status: element.status,
          message: element.message
        }));

        return recursiveStack;
      });
    const {
      data
    } = this.responseFromBRAZE || {};
    if (data !== undefined) recursiveStack.response.push(data);
    if (data !== undefined && data.message === 'success') {
      results = await cafService.markSuccessUserBatchToBraze(externalIds, iBatch, iBrazeThread);
      results.response.forEach(element => recursiveStack.response.push({
        status: element.status,
        message: element.message
      }));
    }
    this.responseFromBRAZE = recursiveStack;
    if (iRetryAttempt === 1) logger.info(`(Repository/sync2braze.upsertUserBatch) # BATCH ${iBatch} THREAD ${iBrazeThread}, Attempt ${iRetryAttempt}, inserted into braze, response: `, this.responseFromBRAZE.response);

    return this.responseFromBRAZE;
  }
}

module.exports = brazeAxiosService;
