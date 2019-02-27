/*
 * Finalizer - This executable helps in finalizing a particular block
 *
 */
const rootPrefix = '..',
  program = require('commander'),
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

let sigIntReceived = false,
  pendingTasksPresent = false;

program
  .option('--chainId <chainId>', 'Chain id')
  .option('--configFile <configFile>', 'Block scanner config strategy absolute file path')
  .option('--blockDelay <blockDelay>', 'No of blocks finalizer should run behind')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log("    node executables/finalizer.js --chainId 189 --configFile './config.json' --blockDelay 6");
  logger.log('');
  logger.log('');
});

class Finalizer {
  /**
   * constructor
   *
   * @param params
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.blockDelay = params.blockDelay;
    oThis.config = require(params.configFile);
  }

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      pendingTasksPresent = false;
      logger.error(' In catch block of executables/finalizer.js');
      return responseHelper.error('e_f_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this;

    while (true) {
      let response = await oThis.startFinalizing();

      if (!response.data.blockProcessable) {
        logger.win('====Block not processable. Waiting for 2 secs...');
        await oThis.waitForNextBlock();
      }
    }
  }

  /**
   * startFinalizing
   *
   * @return {Promise<void>}
   */
  async startFinalizing() {
    const oThis = this,
      instanceComposer = new InstanceComposer(oThis.config),
      blockScannerProvider = instanceComposer.getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      Finalizer = blockScanner.block.Finalize;

    while (true) {
      let finalizer = new Finalizer({
        chainId: oThis.chainId,
        blockDelay: oThis.blockDelay
      });

      pendingTasksPresent = true;

      let response = await finalizer.perform();

      if (response.data.hasOwnProperty('blockProcessable') && !response.data.blockProcessable) {
        pendingTasksPresent = false;
        return response;
      }

      if (response.isFailure()) {
        pendingTasksPresent = false;
        break;
      }
    }

    return responseHelper.successWithData({});
  }

  async waitForNextBlock() {
    return new Promise(function(resolve, reject) {
      setTimeout(resolve, 2000);
    });
  }
}

/**
 * This method performs certain validations on the input params.
 */
let validateAndSanitize = function() {
  if (!program.chainId || !program.configFile || !program.blockDelay) {
    program.help();
    process.exit(1);
  }
};

validateAndSanitize();

let finalizer = new Finalizer(program);

finalizer
  .perform()
  .then(function(a) {
    process.exit(0);
  })
  .catch(function(a) {
    process.exit(1);
  });

let sigIntHandler = function() {
  sigIntReceived = true;

  if (pendingTasksPresent) {
    logger.warn(':: There are pending tasks. Waiting for completion.');
    setTimeout(sigIntHandler, 1000);
  } else {
    logger.warn(':: No pending tasks. Killing the process. ');
    process.exit(0);
  }
};

process.on('SIGINT', sigIntHandler);
process.on('SIGTERM', sigIntHandler);
