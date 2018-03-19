"use strict";

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , ModelBaseKlass = require(rootPrefix + '/app/models/base')
  , dbName = "ost_explorer_" + coreConstants.CHAIN_ID
;

const BlockKlass = function () {
  const oThis = this
  ;

  ModelBaseKlass.call(oThis, {dbName: dbName});
};

BlockKlass.prototype = Object.create(ModelBaseKlass.prototype);

/*
 * Public methods
 */
const BlockSpecificPrototype = {

  tableName: 'blocks'

};

Object.assign(BlockKlass.prototype, BlockSpecificPrototype);

module.exports = BlockKlass;


// ttk = require('./app/models/block')
// new ttk().select('*').where('id>1').limit('10').fire().then(console.log);
