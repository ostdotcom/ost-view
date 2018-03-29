"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , blockConst = require(rootPrefix + '/lib/global_constant/block')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const verified = {
    '0': blockConst.unverified,
    '1': blockConst.verified,
    '2': blockConst.failed
  }
  , invertedVerified = {}
;

invertedVerified[blockConst.unverified] = '0';
invertedVerified[blockConst.verified] = '1';
invertedVerified[blockConst.failed] = '2';

const BlocksKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

BlocksKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BlocksSpecificPrototype = {

  tableName: coreConstants.BLOCKS_TABLE_NAME,
  verified: verified,
  invertedVerified: invertedVerified,

  enums: {
    'verified': {
      val: verified,
      inverted: invertedVerified
    }
  }

};

Object.assign(BlocksKlass.prototype, BlocksSpecificPrototype);

module.exports = BlocksKlass;


// ttk = require('./app/models/block')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
