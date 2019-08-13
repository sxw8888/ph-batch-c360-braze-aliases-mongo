const env = require('../../config/env');
const { CustomerAttributes } = require('../model/customerAttributes');
const logger = require('../../config/logger');

class customerAttributeService {
  // Get caf attribute count
  getCafAttributeCount(fromDate, toDate) {
    const fr = new Date(fromDate);
    let td = new Date(fr.getTime() + env.timeLapse);
    if (toDate) {
      td = new Date(toDate);
    }

    this.cafAttribute = CustomerAttributes.find(
        {
          $or: [
            {
              $and:[
                { marcom_opt_in_flag: 'N',
                  loyalty_opt_in_flag: 'Y',
                  sent_to_braze: false
                }]

            },
            {
              $and:[
                { marcom_opt_in_flag: null,
                  loyalty_opt_in_flag: 'Y',
                  sent_to_braze: false
                }]
            },
            {
              $and:[
                { marcom_opt_in_flag: 'Y',
                  loyalty_opt_in_flag: 'Y',
                  sent_to_braze: false
                }]
            },
            {
              $and:[
                { marcom_opt_in_flag: 'Y',
                  loyalty_opt_in_flag: 'N',
                  sent_to_braze: false
                }]
            },
            {
              $and:[
                { marcom_opt_in_flag: 'Y',
                  loyalty_opt_in_flag: null,
                  sent_to_braze: false
                }]
            }

          ]
        }
    ).countDocuments();
    return this.cafAttribute;
  }

  // Get Caf Attributes
  getCafAggregate(skip, limit, fromDate, toDate) {
    const fr = new Date(fromDate);
    let td = new Date(fr.getTime() + env.timeLapse);
    if (toDate) {
      td = new Date(toDate);
    }
    this.customerAggregate = CustomerAttributes.aggregate([
      { $match:
            {
              $or: [
                {
                  $and:[
                    { marcom_opt_in_flag: 'N',
                      loyalty_opt_in_flag: 'Y',
                      sent_to_braze: false
                    }]

                },
                {
                  $and:[
                    { marcom_opt_in_flag: null,
                      loyalty_opt_in_flag: 'Y',
                      sent_to_braze: false
                    }]
                },
                {
                  $and:[
                    { marcom_opt_in_flag: 'Y',
                      loyalty_opt_in_flag: 'Y',
                      sent_to_braze: false
                    }]
                },
                {
                  $and:[
                    { marcom_opt_in_flag: 'Y',
                      loyalty_opt_in_flag: 'N',
                      sent_to_braze: false
                    }]
                },
                {
                  $and:[
                    { marcom_opt_in_flag: 'Y',
                      loyalty_opt_in_flag: null,
                      sent_to_braze: false
                    }]
                }

              ]
            }
      },
      { $sort: { _id: 1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          external_id: '$crm_id',
          individual_id: '$individual_id',
          first_name: '$first_name',
          last_name: '$last_name',
          phone: '$phone_number',
          email: '$email_address',
          email_domain: '$email_domain',
          email_subscribe: {
            $cond: {
              if: { $eq: ['$marcom_opt_in_flag', 'Y'] },
              then: 'opted_in',
              else: 'unsubscribed',
            },
          },
          qo_cust_guid: '$qo_cust_guid',
          punch_id: '$punch_sys_id',
          push_subscribe: 'Unsubscribed',
          home_store: { $toString: '$home_store' },
          loyalty_opt_in: '$loyalty_opt_in_flag',
          loyalty_status: '$loyalty_status',
          loyalty_join_date: { $toString: '$loyalty_join_date' },
          loyalty_opt_in_date: { $toString: '$loyalty_opt_in_date' },
          loyalty_opt_out_date: { $toString: '$loyalty_opt_out_date' },
          loyalty_activity_date: { $toString: '$loyalty_activity_date' },
          loyalty_point_expiration_date: { $toString: '$loyalty_point_expiration_date' },
          loyalty_current_points_bal: { $toInt: '$loyalty_points_bal' },
          loyalty_last_trans_earned_points: { $toInt: '$loyalty_earned_points' },
          loyalty_promo_earned_points: { $toInt: '$loyalty_promo_earned_points' },
          loyalty_earned_redeemed_points: { $toInt: '$loyalty_earned_redeemed_points' },
          loyalty_promo_redeemed_points: { $toInt: '$loyalty_promo_redeemed_points' },
          loyalty_gift_earned_points: { $toInt: '$loyalty_gift_earned_points' },
          loyalty_gift_redeemed_points: { $toInt: '$loyalty_gift_redeemed_points' },
          loyalty_lifetime_points: { $toInt: '$loyalty_lifetime_points' },
          loyalty_lifetime_earned_points: { $toInt: '$loyalty_lifetime_earned_points' },
          first_purchase_date_icid: { $toString: '$first_purchase_date_icid' },
          last_purchase_date_icid: { $toString: '$last_purchase_date_icid' },
          first_purchase_date_crm: { $toString: '$first_purchase_date_crm' },
          last_purchase_date_crm: { $toString: '$last_purchase_date_crm' },
          avg_guest_check: { $toString: '$avg_guest_check' },
          avg_online: { $toString: '$avg_online' },
          avg_offline: { $toString: '$avg_offline' },
          percent_cash: { $toString: '$pct_cash' },
          percent_credit_card: { $toString: '$pct_credit_card' },
          percent_gift_card: { $toString: '$pct_gift_card' },
          percent_check: { $toString: '$pct_check' },
          percent_carry_out: { $toString: '$carry_out_mix' },
          percent_delivery: { $toString: '$delivery_mix' },
          percent_dine_in: { $toString: '$dine_in_mix' },
          nfl_opt_in: '$nfl_opt_in_flag',
          nfl_team: '$nfl_team',
          dob: '$birth_date',
          sms_opt_in: '$sms_opt_in_flag',
          zip_code: '$zip_code',
          time_zone: '$time_zone',
          retired_flag: '$retired_flag',
          create_id: { $toString: '$create_id' },
          create_tmstmp: { $toString: '$create_tmstmp' },
          updt_id: { $toString: '$updt_id' },
          updt_tmstmp: { $toString: '$updt_tmstmp' },
        },
      },
    ]);
    return this.customerAggregate;
  }

  async markFailedUserBatchToBraze(crmIDs, iBatch, iBrazeThread) {
    logger.debug(`(Repository/sync2braze.customerAttributeService.markFailedUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, marked failed updates to Braze in Mongo  ${crmIDs} `);
    this.statusFailedcrmIDs = await CustomerAttributes.updateMany({ crm_id: { $in: crmIDs } }, { $set: { sent_to_braze: false } })
      .catch((error) => {
        logger.error(`(Repository/sync2braze.customerAttributeService.markFailedUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, error updating mongo : ${error} ########### ${crmIDs}`);
        return error;
      });

    return {
      response: [{
        status: { nModified: this.statusFailedcrmIDs.nModified },
        message: 'Marked the records in MongoDB with flag',
      }],
    };
  }

  async markSuccessUserBatchToBraze(crmIDs, iBatch, iBrazeThread) {
    logger.debug(`(Repository/sync2braze.customerAttributeService.markSuccessUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, Marked Success updates to Braze in Mongo  ${crmIDs} `);
    this.statusSuccesscrmIDs = await CustomerAttributes.updateMany({ crm_id: { $in: crmIDs } }, { $unset: { sent_to_braze: 1 } })
      .catch((error) => {
        logger.error(`(Repository/sync2braze.customerAttributeService.markSuccessUserBatchToBraze) # BATCH ${iBatch} THREAD ${iBrazeThread}, error updating mongo : ${error} ########### ${crmIDs}`);
        return error;
      });

    return {
      response: [{
        status: { nModified: this.statusSuccesscrmIDs.nModified },
        message: 'Unset the flag for records in MongoDB ',
      }],
    };
  }
}

module.exports = customerAttributeService;
