'use strict';
/**
 * Provider for block scanner
 *
 * @module lib/providers/blockScanner
 */
const rootPrefix = '../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  OSTBlockScanner = require('@ostdotcom/ost-block-scanner');

const InstanceComposer = OSTBase.InstanceComposer;

class BlockScannerProvider {
  constructor(configStrategy, instanceComposer) {}

  /**
   * getInstance - Get a new instance of block scanner
   *
   * @param configStrategy
   * @return {*}
   */
  getInstance() {
    const oThis = this;
    let configStrategy = oThis.ic().configStrategy;

    return new OSTBlockScanner(configStrategy);
  }
}

InstanceComposer.registerAsObject(BlockScannerProvider, coreConstants.icNameSpace, 'blockScannerProvider', true);