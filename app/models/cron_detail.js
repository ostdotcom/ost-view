"use strict";

const rootPrefix = '../..'
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , cronDetailConst = require(rootPrefix + '/lib/global_constant/cron_details')
  , util = require(rootPrefix + '/lib/util')
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

const statuses = {
  '1': cronDetailConst.pendingStatus,
  '2': cronDetailConst.completeStatus,
  '3': cronDetailConst.failedStatus
}
  , invertedStatuses = util.invert(statuses);

CronDetailKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const CronDetailsSpecificPrototype = {

  tableName: 'cron_details',

  statuses: statuses,

  invertedStatuses: invertedStatuses

};

Object.assign(CronDetailKlass.prototype, CronDetailsSpecificPrototype);

CronDetailKlass.address_detail_populate_cron = 'address_detail_populate_cron';
CronDetailKlass.aggregator_cron = 'aggregator_cron';
CronDetailKlass.graph_cron = 'graph_cron';

module.exports = CronDetailKlass;


// ttk = require('./app/models/cron_details')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
