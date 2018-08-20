"use strict";
/**
 * Notification Processor
 *
 * @module lib/notificationProcessor
 */
const rootPrefix = ".."
  , logger = require(rootPrefix + "/helpers/custom_console_logger")
  , config = require(rootPrefix + "/config")
  , AddressKlass = require(rootPrefix + "/app/models/address")
  , addressConst = require(rootPrefix + '/lib/global_constant/address')
  , BrandedTokenTransactionTypeKlass = require(rootPrefix + "/app/models/branded_token_transaction_type")
  , BrandedTokenKlass = require(rootPrefix + "/app/models/branded_token")
  , TransactionHashKlass = require(rootPrefix + "/app/models/transaction_hash")
  , AddressesCacheKlass = require(rootPrefix + "/lib/cache_multi_management/addresses")
  , AddressDetailsCacheKlass = require(rootPrefix + "/lib/cache_multi_management/address_details")
  , BrandedTokensCacheKlass = require(rootPrefix + "/lib/cache_multi_management/branded_tokens")
;

const ROPSTON_CHAIN_ID_LIMIT = 10;
/**
 * Constructor to create object of NotificationProcessor

 * @constructor
 */
var NotificationProcessor = function () {

};

/**
 * Processes Transaction event which provided its type
 * @param msgPayload Message Payload
 * @returns {*}
 */
NotificationProcessor.prototype.processTransaction = async function (msgPayload) {

  const chainId = msgPayload.chain_id;

  if (!config.isValidChainId(chainId)) {
    if (chainId > ROPSTON_CHAIN_ID_LIMIT) {
      logger.notify("np_pt_1", 'Invalid chain ID from notification. chain id -', msgPayload);
    } else {
      logger.warn("np_pt_4", 'Invalid chain ID from notification -', chainId);
    }
    return Promise.resolve();
  }

  var contractAddress = msgPayload.erc20_contract_address;
  var transactionHash = msgPayload.transaction_hash;
  var tag = msgPayload.tag;

  if (!contractAddress) {
    logger.warn("np_pt_2", "NotificationProcessor#processTransaction :: erc20_contract_address is not defined", msgPayload);
    return Promise.resolve();
  }

  if (!tag) {
    logger.warn("np_pt_3", "NotificationProcessor#processTransaction :: Tag not defined for transaction hash", msgPayload);
    return Promise.resolve();
  }

  contractAddress = contractAddress.toLowerCase();

  const addressObj = new AddressKlass(chainId)
    , brandedTokenTransactionTypeObj = new BrandedTokenTransactionTypeKlass(chainId)
    , transactionHashObj = new TransactionHashKlass(chainId)
    , addressTypeVal = Number(addressObj.invertedAddressTypes[addressConst.erc20Address])
  ;

  var addressId = null
    , btttId = null
    , btttRow = []
  ;

  const addressRow = await addressObj.select(['id', 'address_type']).where({address_hash: contractAddress}).fire();

  if (addressRow[0]){
    addressId = addressRow[0].id;

    if (addressRow[0].address_type !== addressTypeVal){
      const updateAddressObj = new AddressKlass(chainId);
      await updateAddressObj.update({address_type: addressTypeVal}).where({id: addressId}).fire();
    }

    btttRow = await brandedTokenTransactionTypeObj.select(['id']).where({contract_address_id: addressId, transaction_type: tag}).fire();
  }else{
    const insertAddressObj = new AddressKlass(chainId);
    const addressInsertResponse = await insertAddressObj.insert({
      address_hash: contractAddress,
      address_type: addressTypeVal
    }).onDuplicate({address_type: addressTypeVal, updated_at: new Date()}).fire();

    const selectAddressObj = new AddressKlass(chainId);

    const idSelectResponse = await selectAddressObj.select(['id'])
      .where({address_hash: contractAddress}).fire();

    addressId = idSelectResponse[0].id;
  }

  // Clear addresses cache
  new AddressesCacheKlass({chain_id: chainId, ids: [addressId]}).clear();
  new AddressDetailsCacheKlass({chain_id: chainId, addresses: [contractAddress]}).clear();

  if (btttRow[0]){
    btttId = btttRow[0].id;
  }else{

    const InsertBrandedTokenTransactionTypeObj = new BrandedTokenTransactionTypeKlass(chainId);
    const btttInsertResponse = await InsertBrandedTokenTransactionTypeObj.insert({
      contract_address_id: addressId,
      transaction_type: tag
    }, {insertWithIgnore: true}).fire();

    const selectBrandedTokenIdTransactionTypeObj = new BrandedTokenTransactionTypeKlass(chainId);
    const btttIdSelectResponse = await selectBrandedTokenIdTransactionTypeObj.select(['id'])
      .where({
        contract_address_id: addressId,
        transaction_type: tag
      })
      .fire();

    btttId = btttIdSelectResponse[0].id;
  }

  return transactionHashObj.insert({
    transaction_hash: transactionHash,
    branded_token_transaction_type_id: btttId
  }).onDuplicate({branded_token_transaction_type_id: btttId, updated_at: new Date()}).fire();
};

/**
 * Processes Branded token event which provides branded token updated details.
 * @param msgPayload Message Payload
 */
NotificationProcessor.prototype.processBrandedTokenEvent = async function (msgPayload) {

  const oThis = this
    , chainId = msgPayload.identifier.chain_id
  ;

  if (!config.isValidChainId(chainId)) {
    if (chainId > ROPSTON_CHAIN_ID_LIMIT) {
      logger.notify("np_pbte_1", 'Invalid chain ID from notification. chain id -', msgPayload);
    } else {
      logger.warn("np_pbte_4", 'Invalid chain ID from notification -', chainId);
    }
    return Promise.resolve();
  }

  var contractAddress = msgPayload.identifier.erc20_contract_address
    , data = msgPayload.data
  ;

  if (!contractAddress) {
    logger.notify("np_pbte_2", "NotificationProcessor#processBrandedTokenEvent :: erc20_contractAddress is not defined", msgPayload);
    return Promise.resolve();
  }

  if (!data) {
    logger.notify("np_pbte_3", "NotificationProcessor#processBrandedTokenEvent :: data is not defined", msgPayload);
    return Promise.resolve();
  }

  contractAddress = contractAddress.toLowerCase();

  const brandedTokenObj = new BrandedTokenKlass(chainId)
    , addressObj = new AddressKlass(chainId)
    , addressTypeVal = Number(addressObj.invertedAddressTypes[addressConst.erc20Address])
  ;

  var addressId = null;

  const addressRow = await addressObj.select(['id', 'address_type']).where({address_hash: contractAddress}).fire();

  if (addressRow[0]){
    addressId = addressRow[0].id;

    if (addressRow[0].address_type !== addressTypeVal){
      const updateAddressObj = new AddressKlass(chainId);
      await updateAddressObj.update({address_type: addressTypeVal}).where({id: addressId}).fire();
    }

  } else {
    const insertAddressObj = new AddressKlass(chainId);
    await insertAddressObj.insert({
      address_hash: contractAddress,
      address_type: addressTypeVal
    }).onDuplicate({address_type: addressTypeVal, updated_at: new Date()}).fire();

    const selectAddressObj = new AddressKlass(chainId);
    const addressIdSelectResponse = await selectAddressObj.select(['id'])
      .where({address_hash: contractAddress}).fire();

    addressId = addressIdSelectResponse.id;
  }

  // Clear addresses cache
  new AddressesCacheKlass({chain_id: chainId, ids: [addressId]}).clear();
  new AddressDetailsCacheKlass({chain_id: chainId, addresses: [contractAddress]}).clear();


  var response = {}
    , brandedTokenRowsHash = await brandedTokenObj.select().where({contract_address_id: addressId}).fire()
    , brandedTokenRowHash = brandedTokenRowsHash[0]
  ;

  if (!brandedTokenRowHash) {
    brandedTokenRowHash = {};
    brandedTokenRowHash.name = data.name;
    brandedTokenRowHash.contract_address_id = addressId;
    brandedTokenRowHash.symbol = data.symbol;
    brandedTokenRowHash.uuid = data.uuid;
    brandedTokenRowHash.conversion_rate = data.ost_to_bt_conversion_factor;
    brandedTokenRowHash.symbol_icon = data.symbol_icon;
    brandedTokenRowHash.creation_timestamp = data.created_at;
    brandedTokenRowHash.simple_stake_contract_address = data.simple_stake_contract_addr.toLowerCase();

    const insertBrandedTokenObj = new BrandedTokenKlass(chainId);

    return insertBrandedTokenObj.insert(brandedTokenRowHash, {insertWithIgnore: true}).fire();
  } else {

    var updateFields = {};

    if (data.name && data.name !== '') {
      updateFields.name = data.name;
    }
    if (data.symbol && data.symbol !== '') {
      updateFields.symbol = data.symbol;
    }
    if (data.symbol_icon && data.symbol_icon !== '') {
      updateFields.symbol_icon = data.symbol_icon;
    }
    if (data.ost_to_bt_conversion_factor) {
      updateFields.conversion_rate = data.ost_to_bt_conversion_factor;
    }
    if (data.uuid && data.uuid !== '') {
      updateFields.uuid = data.uuid;
    }
    if (data.simple_stake_contract_addr && data.simple_stake_contract_addr !== '') {
      updateFields.simple_stake_contract_address = data.simple_stake_contract_addr.toLowerCase();
    }
    if (data.created_at) {
      updateFields.creation_timestamp = data.created_at;
    }

    const insertBrandedTokenObj = new BrandedTokenKlass(chainId);
    await insertBrandedTokenObj.update(updateFields).where({id: brandedTokenRowHash.id}).fire();
    return new BrandedTokensCacheKlass({chain_id: chainId, contract_address_ids: [addressId]}).clear();
  }
};

module.exports = new NotificationProcessor();
