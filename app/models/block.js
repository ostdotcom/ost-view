"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , blockConst = require(rootPrefix + '/lib/global_constant/block')
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

const BlockKlass = function (chainId) {
  const oThis = this
  ;

  oThis.dbName = coreConstants.DB_NAME_PREFIX + chainId;
  ModelBaseKlass.call(oThis, {dbName: oThis.dbName});
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
