const env = require('../../config/env');
const { SaleforceEmailOptOut } = require('../model/salesForceEmailOptOut');

class salesForceEmailOptOutService {
  // get salesForceEmail Count for the date
  getSaleForceEmailCountForDate(fromDate, toDate) {
    const fr = new Date(fromDate);
    let td = new Date(fr.getTime() + env.timeLapse);
    if (toDate) {
      td = new Date(toDate);
    }
    this.salesForceEmailOptOutCount = SaleforceEmailOptOut.find(
      {
        updt_tmstmp: {
          $gte: fr,
          $lt: td,
        },
      },
    ).countDocuments();
    return this.salesForceEmailOptOutCount;
  }

  // Get all SalesForce email opt out
  getTotalSalesForceEmailCount() {
    this.salesForceTotalCount = SaleforceEmailOptOut.find({}).estimatedDocumentCount();
    return this.salesForceTotalCount;
  }

  // Get emails thats are opted Out or Opted In
  getSalesForceEmailOptOut(skip, limit, fromDate, toDate) {
    const fr = new Date(fromDate);
    let td = new Date(fr.getTime() + env.timeLapse);
    if (toDate) {
      td = new Date(toDate);
    }
    this.salesForceEmailOptOut = SaleforceEmailOptOut.aggregate([
      {
        $match: {
          updt_tmstmp: {
            $gte: fr,
            $lt: td,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          external_id: '$unified_customer_id',
          email_address: '$email_address',
          email_subscribe: {
            $cond: {
              if: { $eq: ['$email_opt_in_flag', 'Y'] },
              then: 'opted_in',
              else: 'unsubscribed',
            },
          },
        },
      },
    ]);
    return this.salesForceEmailOptOut;
  }
}

module.exports = salesForceEmailOptOutService;
