"use strict";

const rootPrefix = '../..'
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , blockConst = require(rootPrefix + '/lib/global_constant/block')
  , coreConstants = require(rootPrefix + '/config/core_constants')
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

  oThis.chainId = chainId;
  ModelBaseKlass.call(oThis, {chainId: chainId});
};

BlockKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BlockSpecificPrototype = {

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

Object.assign(BlockKlass.prototype, BlockSpecificPrototype);

module.exports = BlockKlass;


// ttk = require('./app/models/block')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
