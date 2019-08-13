const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.Promise = global.Promise;


const SaleforceEmailOptOut = new Schema({
    unified_customer_id: {
        type: Number,
    },

    email_opt_in_flag: {
        type: String
    }

}, {
    timestamps: true,
});


module.exports = {
    SaleforceEmailOptOut: mongoose.model('SaleforceEmailOptOut', SaleforceEmailOptOut, 'salesforce.email_opt_out'),


};
