/*
 * GetBasicDetails - Service for getting basic details of an address
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  addressFormatter = require(rootPrefix + '/lib/formatter/entities/address'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

class GetAddressBasicDetails {
  /**
   * constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.address = params.address;
  }

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/address/GetBasicDetails.js');
      return responseHelper.error('s_a_gbd_1', 'something_went_wrong');
    });
  }

  /**
   *
   * @returns {Promise<*|result|Object<result>|Object<Result>>}
   */
  async asyncPerform() {
    const oThis = this;

    let validateAndSanitizeResponse = await oThis.validateAndSanitize();

    if (validateAndSanitizeResponse.isFailure()) {
      return validateAndSanitizeResponse;
    }

    return oThis._getAddressDetails();
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.paramValidationError('s_a_gbd_2', ['chainId']);
    }

    if (!CommonValidator.isEthAddressValid(oThis.address)) {
      return responseHelper.paramValidationError('s_a_gbd_3', ['address']);
    }

    return responseHelper.successWithData({});
  }

  /**
   *
   * @returns {Promise<*>}
   */
  async _getAddressDetails() {
    const oThis = this;

    const blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      AddressBasicDetails = blockScanner.address.GetBasicDetails;

    let addressBasicDetails = new AddressBasicDetails(oThis.chainId, oThis.address);

    let addressBasicDetailsResponse = await addressBasicDetails.perform();

    if (addressBasicDetailsResponse.isFailure()) {
      return Promise.resolve(responseHelper.error('s_a_gbd_5', 'block details get service failed'));
    }

    let addressBasicDetailsInfo = addressBasicDetailsResponse.data[oThis.address];

    addressBasicDetailsInfo['chainId'] = oThis.chainId;

    let address = await addressFormatter.perform(addressBasicDetailsInfo);

    return responseHelper.successWithData(address);
  }
}

InstanceComposer.registerAsShadowableClass(GetAddressBasicDetails, coreConstants.icNameSpace, 'GetAddressBasicDetails');
