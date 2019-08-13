const mongoose = require('mongoose');
const env = require('../../config/env');

const { Schema } = mongoose;
mongoose.Promise = global.Promise;


const CustomerAttributes = new Schema({
  crm_id: {
    type: String,
  },
  individual_id: {
    type: Number,
  },
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  email_address: {
    type: String,
  },
  qo_cust_guid: {
    type: String,
  },
  punch_sys_id: {
    type: String,
  },
  phone_number: {
    type: String,
  },
  loyalty_opt_in_flag: {
    type: String,
  },
  marcom_opt_in_flag: {
    type: String,
  },
  email_status: {
    type: String,
  },
  sms_opt_in_flag: {
    type: String,
  },
  loyalty_status: {
    type: String,
  },
  loyalty_join_date: {
    type: Date,
  },
  loyalty_activity_date: {
    type: Date,
  },
  loyalty_point_expiration_date: {
    type: Date,
  },
  loyalty_points_bal: {
    type: Number,
  },
  loyalty_earned_points: {
    type: Number,
  },
  loyalty_promo_earned_points: {
    type: Number,
  },
  loyalty_earned_redeemed_points: {
    type: Number,
  },
  loyalty_promo_redeemed_points: {
    type: Number,
  },
  loyalty_gift_earned_points: {
    type: Number,
  },
  loyalty_gift_redeemed_points: {
    type: Number,
  },
  loyalty_lifetime_points: {
    type: Number,
  },
  loyalty_lifetime_earned_points: {
    type: Number,
  },
  loyalty_opt_in_date: {
    type: Date,
  },
  loyalty_opt_out_date: {
    type: Date,
  },
  home_store: {
    type: String,
  },
  zip_code: {
    type: String,
  },
  time_zone: {
    type: String,
  },
  first_purchase_date_icid: {
    type: Date,
  },
  last_purchase_date_icid: {
    type: Date,
  },
  first_purchase_date_crm: {
    type: Date,
  },
  last_purchase_date_crm: {
    type: Date,
  },
  avg_guest_check: {
    type: Number,
  },
  avg_online: {
    type: Number,
  },
  avg_offline: {
    type: Number,
  },
  pct_cash: {
    type: Number,
  },
  pct_credit_card: {
    type: Number,
  },
  pct_gift_card: {
    type: Number,
  },
  pct_check: {
    type: Number,
  },
  carry_out_mix: {
    type: Number,
  },
  delivery_mix: {
    type: Number,
  },
  dine_in_mix: {
    type: Number,
  },
  nfl_opt_in_flag: {
    type: String,
  },
  nfl_team: {
    type: String,
  },
  birth_date: {
    type: String,
  },
  retired_flag: {
    type: String,
  },
  create_id: {
    type: String,
  },
  create_tmstmp: {
    type: Date,
  },
  updt_id: {
    type: String,
  },
  updt_tmstmp: {
    type: Date,
  },

  source_name: {
    type: String,
  },
  acct_name: {
    type: String,
  },
  email_domain: {
    type: String,
  },
  sent_to_braze: {
    type: Boolean,
  },
  source_create_tmstmp: {
    type: Date,
  },
  source_updt_tmstmp: {
    type: Date,
  },
  aud_ver_nbr: {
    type: Number,
  },

}, {
  timestamps: true,
});


module.exports = {
  CustomerAttributes: mongoose.model('CustomerAttributes', CustomerAttributes, env.customerAttribCollection),

};
