"use strict";

const rootPrefix = '../..'
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , blockConst = require(rootPrefix + '/lib/global_constant/block')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , util = require(rootPrefix + '/lib/util')
;

const verified = {
    '1': blockConst.unverified,
    '2': blockConst.verified
  }

  , statuses = {
    '1': blockConst.pendingStatus,
    '2': blockConst.completeStatus,
    '3': blockConst.failedStatus
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

BlockKlass.DATA_SEQUENCE_ARRAY = ['block_number', 'block_hash', 'parent_hash', 'difficulty', 'total_difficulty', 'gas_limit', 'gas_used', 'total_transactions', 'block_timestamp', 'verified' ,'status'];

module.exports = BlockKlass;


// ttk = require('./app/models/block')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
