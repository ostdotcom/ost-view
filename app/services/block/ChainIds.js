/**
 * ChainIds - Service for getting chain ids where a particular block is present
 *
 * @module app/services/block/ChainIds
 */
const rootPrefix = '../../..',
  OSTBase = require('@openstfoundation/openst-base'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

// Following require(s) for registering into instance composer
require(rootPrefix + '/lib/providers/blockScanner');

/**
 * Class for getting chainIds.
 *
 * @class
 */
class GetChainIds {
  /**
   * Constructor for getting chainIds.
   *
   * @constructor
   */
  constructor(blockNumber) {
    const oThis = this;

    oThis.blockNumber = blockNumber;
  }

  /**
   * Main performer method for the class.
   *
   * @returns {Promise<*>}
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/block/ChainIds.js');
      return responseHelper.error('s_b_ci_1', 'something_went_wrong');
    });
  }

  /**
   * Async performer.
   *
   * @returns {Promise<*>}
   */
  async asyncPerform() {
    const oThis = this;

    let validateAndSanitizeResponse = await oThis.validateAndSanitize();

    if (validateAndSanitizeResponse.isFailure()) {
      return validateAndSanitizeResponse;
    }

    let blockChainIdsResponse = await oThis.getBlockChainIds();

    return blockChainIdsResponse;
  }

  /**
   * This method performs certain validations on the input params.
   *
   * @returns {Promise<>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.blockNumber)) {
      return responseHelper.paramValidationError('s_b_ci_2', ['blockNumber']);
    }

    return responseHelper.successWithData({});
  }

  /**
   * This method fetches the chainIds which have the blockNumber being passed.
   *
   * @returns {Promise<*>}
   */
  async getBlockChainIds() {
    const oThis = this;
    let searchResultArray = [];

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      blockGetChainIdsService = blockScanner.block.GetChainIds;

    let blockGetChainIds = new blockGetChainIdsService(oThis.blockNumber),
      blockGetChainIdsResponse = await blockGetChainIds.perform().catch(function(err) {
        logger.error('Error in block get service');
        return Promise.resolve(responseHelper.error('s_b_ci_4', 'something_went_wrong'));
      });

    for (let index in blockGetChainIdsResponse.data[oThis.blockNumber]) {
      let searchResultHash = {};
      searchResultHash['kind'] = coreConstants.blockEntity;
      searchResultHash['payload'] = {};
      searchResultHash['payload']['chainId'] = blockGetChainIdsResponse.data[oThis.blockNumber][index];
      searchResultHash['payload']['blockNumber'] = oThis.blockNumber;
      searchResultArray.push(searchResultHash);
    }

    return Promise.resolve(responseHelper.successWithData(searchResultArray));
  }
}

InstanceComposer.registerAsShadowableClass(GetChainIds, coreConstants.icNameSpace, 'GetChainIds');
