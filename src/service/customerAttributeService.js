const env = require('../../config/env');
const {
  CustomerAttributes
} = require('../model/customerAttributes');
const logger = require('../../config/logger');

class customerAttributeService {
  // Get caf attribute count
  getCount(fromDate, toDate) {
    const fr = new Date(fromDate);
    let td = new Date(fr.getTime() + env.timeLapse);
    if (toDate) {
      td = new Date(toDate);
    }
    logger.info(`(src/service/customerAttributeService.js) getCount(): from ${fr} to ${td}`);
    this.cafAttribute = CustomerAttributes.find({
      updt_tmstmp: {
        $gte: fr,
        $lt: td
      }
    }, )
    .limit(10)
    .countDocuments();
    return this.cafAttribute;
    }

  // Get Caf Attributes
  getEmailAliases(skip, limit, fromDate, toDate) {
    const fr = new Date(fromDate);
    let td = new Date(fr.getTime() + env.timeLapse);
    if (toDate) {
      td = new Date(toDate);
    }
    logger.info(`(src/service/customerAttributeService.js) getEmailAliases(): from ${fr} to ${td}`);
    this.customerAggregate = CustomerAttributes.aggregate([{
        $match: {
          updt_tmstmp: {
            $gte: fr,
            $lt: td
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          external_id: '$crm_id',
          alias_label: 'email_address',
          alias_name: '$email_address',
          // qo_cust_guid: '$qo_cust_guid',
          // punch_id: '$punch_sys_id',
        },
      },
    ])
    .limit(10);
    return this.customerAggregate;
  }

  async markFailedUserBatchToBraze(crmIDs, iBatch, iBrazeThread) {
    logger.debug(`(Repository/sync2braze.customerAttributeService.markFailedUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, marked failed updates to Braze in Mongo  ${crmIDs} `);
    this.statusFailedcrmIDs = await CustomerAttributes.updateMany({
        crm_id: {
          $in: crmIDs
        }
      }, {
        $set: {
          set_aliases: false
        }
      })
      .catch((error) => {
        logger.error(`(Repository/sync2braze.customerAttributeService.markFailedUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, error updating mongo : ${error} ########### ${crmIDs}`);
        return error;
      });

    return {
      response: [{
        status: {
          nModified: this.statusFailedcrmIDs.nModified
        },
        message: 'Marked the records in MongoDB with flag',
      }],
    };
  }

  async markSuccessUserBatchToBraze(crmIDs, iBatch, iBrazeThread) {
    logger.debug(`(Repository/sync2braze.customerAttributeService.markSuccessUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, Marked Success updates to Braze in Mongo  ${crmIDs} `);
    this.statusSuccesscrmIDs = await CustomerAttributes.updateMany({
        crm_id: {
          $in: crmIDs
        }
      }, {
        $set: {
          set_aliases: true
        }
      })
      .catch((error) => {
        logger.error(`(Repository/sync2braze.customerAttributeService.markSuccessUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, error updating mongo : ${error} ########### ${crmIDs}`);
        return error;
      });

    return {
      response: [{
        status: {
          nModified: this.statusSuccesscrmIDs.nModified
        },
        message: 'Unset the flag for records in MongoDB ',
      }],
    };
  }
}

module.exports = customerAttributeService;
