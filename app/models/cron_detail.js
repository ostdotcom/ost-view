"use strict";

const rootPrefix = '../..'
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
;

const CronDetailsKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

CronDetailsKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const CronDetailsSpecificPrototype = {

  tableName: 'cron_details'

};

Object.assign(CronDetailsKlass.prototype, CronDetailsSpecificPrototype);

module.exports = CronDetailsKlass;


// ttk = require('./app/models/cron_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
