'use strict';
/*
 * GetHolders - Get top holders by balance
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@ostdotcom/base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  base64Helper = require(rootPrefix + '/lib/Base64/helper'),
  tokenHolderFormatter = require(rootPrefix + '/lib/formatter/entities/tokenHolder'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/lib/providers/blockScanner');

class GetHolders {
  /**
   * constructor
   *
   * @param params
   * @param chainId {Number} - chainId on which economy is present
   * @param contractAddress {String} - contract address for identifying economy
   * @param [paginationIdentifier] {String} - Optional, pagination identifier
   */
  constructor(params) {
    const oThis = this;

    oThis.chainId = params.chainId;
    oThis.contractAddress = params.contractAddress;
    oThis.paginationIdentifier = params.paginationIdentifier;
    oThis.tokenHolders = [];
  }

  /**
   * perform
   *
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(' In catch block of app/services/economy/GetHolders.js');
      return responseHelper.error('s_e_gh_1', 'something_went_wrong', err);
    });
  }

  /**
   * asyncPerform
   *
   * @return {Promise<void>}
   */
  async asyncPerform() {
    const oThis = this;

    await oThis.validateAndSanitize();

    let result = await oThis.getTokenHolders();

    return responseHelper.successWithData(result);
  }

  /**
   * validateAndSanitize
   */
  async validateAndSanitize() {
    const oThis = this;

    if (!CommonValidator.isVarInteger(oThis.chainId)) {
      return responseHelper.error('s_e_gh_2', 'chainId is missing');
    }
    if (!CommonValidator.isEthAddressValid(oThis.contractAddress)) {
      return responseHelper.error('s_e_gh_3', 'contractAddress is missing');
    }
  }

  /**
   * Get token holders of economy
   *
   */
  async getTokenHolders() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      economyTokenHolderService = blockScanner.economy.GetTokenHolders;

    let encryptedNextPagePayload = {};

    let options = {};
    options.pageSize = coreConstants.DEFAULT_PAGE_SIZE;

    if (oThis.paginationIdentifier) {
      //decrypt the params
      let decryptedPaginationParamsString = base64Helper.decode(oThis.paginationIdentifier);
      options['nextPagePayload'] = JSON.parse(decryptedPaginationParamsString);
    }

    let economyGetHolders = new economyTokenHolderService(oThis.chainId, oThis.contractAddress, options),
      economyGetHoldersResp = await economyGetHolders.perform(),
      response = {};

    if (!economyGetHoldersResp.isSuccess() && !economyGetHoldersResp.data.tokenHolders) {
      return responseHelper.error('s_e_gh_4', 'Data Not found');
    }

    oThis.tokenHolders = economyGetHoldersResp.data.tokenHolders;
    let userBalances = await oThis._fetchTokenBalances();

    response['tokenHolders'] = [];
    for (let index in oThis.tokenHolders) {
      oThis.tokenHolders[index]['balance'] = userBalances[oThis.tokenHolders[index].address].balance || 0;
      let ft = await tokenHolderFormatter.perform(oThis.tokenHolders[index]);
      response['tokenHolders'].push(ft);
    }

    response['nextPagePayload'] = {};

    if (economyGetHoldersResp.data.nextPagePayload.LastEvaluatedKey) {
      //Encrypt next page payload
      encryptedNextPagePayload = base64Helper.encode(JSON.stringify(economyGetHoldersResp.data.nextPagePayload));
      response['nextPagePayload']['paginationIdentifier'] = encryptedNextPagePayload;
    }

    return response;
  }

  /**
   * Fetch token balances
   *
   */
  async _fetchTokenBalances() {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      EconomyAddressGetBalance = blockScanner.address.GetBalance;

    let addresses = [];
    for (let index in oThis.tokenHolders) {
      addresses.push(oThis.tokenHolders[index].address);
    }

    let economyAddressGetBalance = new EconomyAddressGetBalance(oThis.chainId, oThis.contractAddress, addresses),
      economyAddressGetBalanceRsp = await economyAddressGetBalance.perform();

    return economyAddressGetBalanceRsp.data;
  }
}

InstanceComposer.registerAsShadowableClass(GetHolders, coreConstants.icNameSpace, 'GetHolders');
