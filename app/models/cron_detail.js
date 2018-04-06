"use strict";

const rootPrefix = '../..'
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

/**
 * constructor
 *
 * @param {Object} chainId - chain id
 *
 * @constructor
 */
const CronDetailKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

CronDetailKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const CronDetailsSpecificPrototype = {

  tableName: 'cron_details'

};

Object.assign(CronDetailKlass.prototype, CronDetailsSpecificPrototype);

CronDetailKlass.address_detail_populate_cron = 'address_detail_populate_cron';

module.exports = CronDetailKlass;


// ttk = require('./app/models/cron_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
