'use strict';
/**
 * This is executable for global aggregator, it aggregates data and gives stats to show on home page.
 *
 * Usage: node executables/GlobalAggregatorCron.js --configFile $(pwd)/config.json
 *
 * @module executables/GlobalAggregatorCron
 */

const rootPrefix = '..',
  program = require('commander'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  errorConfig = basicHelper.getErrorConfig();

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/app/services/home/GlobalAggregator');

program
  .option('--chainId <chainId>', 'Chain id')
  .option('--configFile <configFile>', 'OST View config strategy absolute file path')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log("    node executables/GlobalAggregatorCron.js --configFile './config.json'");
  logger.log('');
  logger.log('');
});

class GlobalAggregator {
  constructor(params) {
    const oThis = this;
    oThis.config = require(params.configFile);
  }

  /**
   * Main performer method for the class.
   *
   * @returns {Promise<>}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of executables/GlobalAggregatorCron');
      return responseHelper.error({
        internal_error_identifier: 'e_gac_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: err,
        error_config: errorConfig
      });
    });
  }

  /**
   * Async performer.
   *
   * @returns {Promise<>}
   */
  async asyncPerform() {
    const oThis = this,
      instanceComposer = new InstanceComposer(oThis.config);

    const GlobalAggregator = instanceComposer.getShadowedClassFor(coreConstants.icNameSpace, 'GlobalAggregator'),
      globalAggregatorObj = new GlobalAggregator({});

    globalAggregatorObj.asyncPerform().then(console.log);
  }

  /**
   * sleep for particular time
   *
   * @param ms {number} - time in ms
   *
   * @returns {Promise<any>}
   */
  sleep(ms) {
    return new Promise(function(resolve) {
      setTimeout(resolve, ms);
    });
  }
}

/**
 * This method performs certain validations on the input params.
 */
let validateAndSanitize = function() {
  if (!program.configFile) {
    program.help();
    process.exit(1);
  }
};
let aggregatorObject = new GlobalAggregator(program);

aggregatorObject
  .perform()
  .then(function(a) {
    logger.info('DONE======');
  })
  .catch(function(a) {
    process.exit(1);
  });
