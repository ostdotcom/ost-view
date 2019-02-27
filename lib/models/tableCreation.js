'use strict';
/**
 * This script is used table creation.
 *
 * Usage: node lib/models/tableCreation
 *
 * @module lib/models/tableCreation
 */
const program = require('commander');

const rootPrefix = '../..',
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer

require(rootPrefix + '/lib/models/GlobalStats');

program.option('--configFile <configFile>', 'config strategy absolute file path').parse(process.argv);

program.on('--help', () => {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(" node lib/models/tableCreation.js --configFile './config.json'");
  logger.log('');
  logger.log('');
});

/**
 * Constructor for initial setup
 *
 * @class
 */
class TableCreation {
  constructor(params) {}

  /**
   * Main performer method for the class.
   *
   * @returns {Promise<T>}
   */
  perform() {
    const oThis = this;

    oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of lib/models/tableCreation::perform');
      return responseHelper.error({
        internal_error_identifier: 'l_m_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: err,
        error_config: {}
      });
    });
  }

  /**
   * Async performer.
   *
   * @returns {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this,
      GlobalStats = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GlobalStats'),
      globalStatsObject = new GlobalStats({});

    // Create GlobalStats Table
    await globalStatsObject.createTable();
  }
}

InstanceComposer.registerAsObject(TableCreation, coreConstants.icNameSpace, 'TableCreation', true);

/**
 * This method performs certain validations on the input params.
 */
const validateAndSanitize = function() {
  if (!program.configFile) {
    program.help();
    process.exit(1);
  }
};

validateAndSanitize();

const config = require(program.configFile),
  instanceComposer = new InstanceComposer(config),
  setupInit = instanceComposer.getInstanceFor(coreConstants.icNameSpace, 'TableCreation');
setupInit.perform();
