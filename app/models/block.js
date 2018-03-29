"use strict";

const rootPrefix = '../..'
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , blockConst = require(rootPrefix + '/lib/global_constant/block')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , util = require(rootPrefix + '/lib/util')
;

const verified = {
    '0': blockConst.unverified,
    '1': blockConst.verified
  }

  , statuses = {
    '0': blockConst.pendingStatus,
    '1': blockConst.completeStatus,
    '2': blockConst.failedStatus
  }
  , invertedStatuses = util.invert(statuses)
  , invertedVerified = util.invert(verified)
;

const BlockKlass = function (chainId) {
  const oThis = this
  ;

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

BlockKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BlockSpecificPrototype = {

  tableName: coreConstants.BLOCKS_TABLE_NAME,

  statuses: statuses,

  invertedStatuses: invertedStatuses,

  verified: verified,

  invertedVerified: invertedVerified,

  enums: {
    'verified': {
      val: verified,
      inverted: invertedVerified
    },
    'status': {
      val: statuses,
      inverted: invertedStatuses
    }
  }

};

Object.assign(BlockKlass.prototype, BlockSpecificPrototype);

module.exports = BlockKlass;


// ttk = require('./app/models/block')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
