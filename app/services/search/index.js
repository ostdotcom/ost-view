/*
 * GetBlockTransactions - Service for getting block transactions
 *
 */

const rootPrefix = '../../..',
  OSTBase = require('@openstfoundation/openst-base'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  tokenNameSearchFormatter = require(rootPrefix + '/lib/formatter/entities/tokenNameSearch'),
  tokenHolderSearchFormatter = require(rootPrefix + '/lib/formatter/entities/tokenHolderSearch'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  CommonValidator = require(rootPrefix + '/lib/validators/common');

const InstanceComposer = OSTBase.InstanceComposer;

require(rootPrefix + '/app/services/block/ChainIds');

class SearchIndex {
  /**
   * constructor
   *
   * @param {object} params
   * @param {string} params.q - search term
   *
   */
  constructor(params) {
    const oThis = this;

    oThis.queryArgument = params.q;
  }

  /**
   * performer
   */
  perform() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(err) {
      logger.error(`${__filename}::perform::catch`);
      logger.error(err);

      if (responseHelper.isCustomResult(err)) {
        return err;
      } else {
        return responseHelper.error('a_s_si_1', 'something_went_wrong');
      }
    });
  }

  /**
   * Async perform
   *
   * @returns {Promise<any>}
   */
  async asyncPerform() {
    const oThis = this;

    let response = {};

    if (
      oThis.queryArgument.length == coreConstants.ETH_ADDRESS_LENGTH &&
      CommonValidator.isEthAddressValid(oThis.queryArgument)
    ) {
      //given entity is address
      logger.info('Search entity is address:', oThis.queryArgument);
      response = await oThis._getAddressSearchResults(oThis.queryArgument);
    } else if (
      oThis.queryArgument.length == coreConstants.TRANSACTION_HASH_LENGTH &&
      CommonValidator.isTxHashValid(oThis.queryArgument)
    ) {
      //given entity is transaction hash
      logger.info('Search entity is hash:', oThis.queryArgument);
      response = await oThis._getTransactionSearchResults(oThis.queryArgument);
    } else if (oThis.queryArgument == parseInt(oThis.queryArgument)) {
      //given entity is block number
      let blockNumber = parseInt(oThis.queryArgument);
      logger.info('Search entity is block number:', blockNumber);
      response = await oThis._getBlockSearchResults(blockNumber);
    } else if (CommonValidator.isTokenNameValid(oThis.queryArgument)) {
      //given entity is economy name
      let economyName = oThis.queryArgument;
      logger.info('Search entity is token name or token symbol:', economyName);
      response = await oThis._getTokenNameOrSymbolSearchResults(economyName);
    } else {
      //Invalid search term
      logger.info('Search term invalid:', oThis.queryArgument);
      response = responseHelper.error('a_s_s_i_5', 'token data not found');
    }
    return response;
  }

  /**
   * returns search results for given address.
   *
   * @param {string} searchAddress - Ethereum address.
   *
   * @returns {Promise}
   *
   * @private
   */
  async _getAddressSearchResults(searchAddress) {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      shardByEconomyAddressService = blockScanner.model.ShardByEconomyAddress;

    let shardByEconomyAddress = new shardByEconomyAddressService({}),
      addressDetailsRsp = await shardByEconomyAddress.fetchAddressDetails(searchAddress),
      searchResultsArray = [],
      probableEconomyAddressChainIdArray = [],
      chainIdToContractAddressHash = {};

    if (addressDetailsRsp.isSuccess() && addressDetailsRsp.data.length > 0) {
      for (let index in addressDetailsRsp.data) {
        let searchResultsHash = {};
        if (addressDetailsRsp.data[index].contractAddress == '0x0') {
          let payload = addressDetailsRsp.data[index];
          searchResultsHash['kind'] = coreConstants.addressEntity;
          searchResultsHash['payload'] = addressDetailsRsp.data[index];
          searchResultsArray.push(searchResultsHash);
          chainIdToContractAddressHash[payload.chainId] = chainIdToContractAddressHash[payload.chainId] || [];
          if (!chainIdToContractAddressHash[payload.chainId].includes(payload.address)) {
            chainIdToContractAddressHash[payload.chainId].push(payload.address);
            probableEconomyAddressChainIdArray.push(payload.chainId);
          }
        } else {
          let chainId = addressDetailsRsp.data[index].chainId,
            contractAddress = addressDetailsRsp.data[index].contractAddress;

          chainIdToContractAddressHash[chainId] = chainIdToContractAddressHash[chainId] || [];
          if (!chainIdToContractAddressHash[chainId].includes(contractAddress)) {
            chainIdToContractAddressHash[chainId].push(contractAddress);
          }
        }
      }
      let contractAddressDetailsArray = await oThis._fetchContractAddressDetails(
        chainIdToContractAddressHash,
        probableEconomyAddressChainIdArray
      );
      searchResultsArray = searchResultsArray.concat(contractAddressDetailsArray);
    } else {
      return Promise.resolve(responseHelper.error('a_s_s_i_1', 'address data not found'));
    }

    return Promise.resolve(responseHelper.successWithData(searchResultsArray));
  }

  /**
   * return search results for transaction hash passed.
   *
   * @param {string}transactionHash
   * @returns {Promise<any>}
   * @private
   */
  async _getTransactionSearchResults(transactionHash) {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      shardByTransactionService = blockScanner.model.ShardByTransaction;

    let shardByTransaction = new shardByTransactionService({ consistentRead: false }),
      shardByTransactionRsp = await shardByTransaction.fetchTransactionDetails(transactionHash),
      searchResultsArray = [];

    if (shardByTransactionRsp.isSuccess() && shardByTransactionRsp.data.length > 0) {
      for (let index in shardByTransactionRsp.data) {
        let txHashInfo = {};
        txHashInfo['kind'] = coreConstants.transactionEntity;
        txHashInfo['payload'] = shardByTransactionRsp.data[index];
        searchResultsArray.push(txHashInfo);
      }
    } else {
      return Promise.resolve(responseHelper.error('a_s_s_i_2', 'transaction data not found'));
    }
    return Promise.resolve(responseHelper.successWithData(searchResultsArray));
  }

  /**
   * return search results for given block number
   *
   * @param {number} blockNumber
   * @returns {Promise<any>}
   * @private
   */
  async _getBlockSearchResults(blockNumber) {
    const oThis = this,
      BlockGetChainIds = oThis.ic().getShadowedClassFor(coreConstants.icNameSpace, 'GetChainIds'),
      blockGetChainIdsObj = new BlockGetChainIds(blockNumber),
      blockGetChainIdsRsp = await blockGetChainIdsObj.perform();

    if (blockGetChainIdsRsp.isSuccess() && blockGetChainIdsRsp.data.length > 0) {
      return Promise.resolve(blockGetChainIdsRsp);
    } else {
      return Promise.resolve(responseHelper.error('a_s_s_i_3', 'block number data not found'));
    }
  }

  /**
   * return search results for given token name or symbol
   *
   * @param {string} tokenNameOrSymbol
   * @returns {Promise<any>}
   * @private
   */
  async _getTokenNameOrSymbolSearchResults(tokenNameOrSymbol) {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      economyService = blockScanner.model.Economy;

    let economy = new economyService({ consistentRead: false }),
      economyRsp = await economy.searchByNameOrSymbol(tokenNameOrSymbol),
      searchResultsArray = [];

    if (economyRsp.isSuccess() && economyRsp.data.length > 0) {
      for (let index in economyRsp.data) {
        let tokenNameSearchHash = await tokenNameSearchFormatter.perform(economyRsp.data[index]);
        let searchResultHash = {};
        searchResultHash['kind'] = coreConstants.tokenEntity;
        searchResultHash['payload'] = tokenNameSearchHash;
        searchResultsArray.push(searchResultHash);
      }
    } else {
      return Promise.resolve(responseHelper.error('a_s_s_i_4', 'token data not found'));
    }
    return Promise.resolve(responseHelper.successWithData(searchResultsArray));
  }

  async _fetchContractAddressDetails(chainIdToContractAddressesHash, probableEconomyAddressChainIdArray) {
    const oThis = this,
      blockScannerProvider = oThis.ic().getInstanceFor(coreConstants.icNameSpace, 'blockScannerProvider'),
      blockScanner = blockScannerProvider.getInstance(),
      EconomyService = blockScanner.model.Economy,
      responseArray = [];

    let economyServiceObj = new EconomyService({ consistentRead: false }),
      queryResponse = await economyServiceObj.multiGetEconomiesData(chainIdToContractAddressesHash);

    if (queryResponse.isSuccess()) {
      for (let uniqueKey in queryResponse.data) {
        let economyData = queryResponse.data[uniqueKey],
          searchResultsHash = {};
        if (
          economyData.contractAddress == oThis.queryArgument &&
          probableEconomyAddressChainIdArray.includes(economyData.chainId)
        ) {
          //It is an token entity
          let formattedTokenData = await tokenNameSearchFormatter.perform(economyData);
          searchResultsHash['kind'] = coreConstants.tokenEntity;
          searchResultsHash['payload'] = formattedTokenData;
          responseArray.push(searchResultsHash);
        } else {
          let formattedContractData = await tokenHolderSearchFormatter.perform(economyData);
          formattedContractData['address'] = oThis.queryArgument;

          searchResultsHash['kind'] = coreConstants.tokenHolderEntity;
          searchResultsHash['payload'] = formattedContractData;
          responseArray.push(searchResultsHash);
        }
      }
    }

    return Promise.resolve(responseArray);
  }
}

InstanceComposer.registerAsShadowableClass(SearchIndex, coreConstants.icNameSpace, 'SearchIndex');
