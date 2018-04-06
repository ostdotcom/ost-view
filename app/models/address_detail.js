"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

/**
 * constructor
 *
 * @param {Object} chainId - chain id
 *
 * @constructor
 */
const AddressDetailsKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

AddressDetailsKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const AddressDetailsSpecificPrototype = {

  tableName: coreConstants.ADDRESS_DETAILS_TABLE_NAME,

  selectTotalTokenDetails: async function(contractAddressIds){
    const oThis = this;

    var data = await oThis.select('count(*) AS total_users, SUM(tokens) AS total_tokens, contract_address_id').
        where(["contract_address_id IN (?)", contractAddressIds]).group_by(["contract_address_id"]).fire();

    let tokenDetails = {};

    for(var i=0;i<data.length;i++){
      var row = data[i];
      tokenDetails[row.contract_address_id] = {total_users: row.total_users, total_tokens: row.total_tokens};
    }
    return Promise.resolve(tokenDetails);
  }

};

Object.assign(AddressDetailsKlass.prototype, AddressDetailsSpecificPrototype);

module.exports = AddressDetailsKlass;


// ttk = require('./app/models/address_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
