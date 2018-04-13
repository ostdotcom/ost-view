"use strict";

const rootPrefix = '..'
  , TransactionTypeIdKlass = require(rootPrefix + '/migration_code/transaction_type_id.js')
  , TransactionTypeKlass = require(rootPrefix + '/migration_code/transaction_type.js')
  , BrandedTokenTransactionTypeKlass = require(rootPrefix + '/app/models/branded_token_transaction_type.js')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AddressesIdMapCacheKlass = require(rootPrefix + '/lib/cache_multi_management/addressIdMap')
  , TransactionHashesKlass = require(rootPrefix + '/app/models/transaction_hash.js')
  , OpenSTNotification = require('@openstfoundation/openst-notification')

;


const WAIT_TIME = 5000;

const TransactionTypeMigrationKlass = function (params) {
  const oThis = this;
  oThis.src_chain_id = params.src_chain_id;
  oThis.des_chain_id = params.des_chain_id;
};

/**
 * TransactionTypeMigrationKlass
 * @type {{perform: TransactionTypeMigrationKlass.perform, createTransactionTypeHashList: TransactionTypeMigrationKlass.createTransactionTypeHashList, fetchTransactionHashesTypeIds: TransactionTypeMigrationKlass.fetchTransactionHashesTypeIds, getAddressHashIdMap: TransactionTypeMigrationKlass.getAddressHashIdMap}}
 */
TransactionTypeMigrationKlass.prototype = {

  perform: async function () {
    const oThis = this
      , BatchSize = 50
    ;

    let offset = 0;
    try {
      while (true) {
        // 1. Create transaction hash list with type from src db
        let transactionTypeHashList = await oThis.createTransactionTypeHashList(offset, BatchSize);

        // 1.1 Break if not transaction found
        if (transactionTypeHashList.length < 1) break;

        for (let index = 0; index < transactionTypeHashList.length; index++) {
          let txnTypeHash = transactionTypeHashList[index];

          if (!txnTypeHash || !txnTypeHash.contract_address || !txnTypeHash.transaction_hash || !txnTypeHash.transaction_type) {
            throw "TransactionTypeMigrationKlass issue with txnTypeHash" + txnTypeHash;
          }

          OpenSTNotification.publishEvent.perform(
            {
              topics: ["migration.transfer"],
              publisher: 'OST',
              message: {
                kind: "transaction_mined",
                payload: {
                  chain_id: oThis.des_chain_id,
                  erc20_contract_address: txnTypeHash.contract_address,
                  transaction_hash: txnTypeHash.transaction_hash,
                  tag: txnTypeHash.transaction_type,
                  contract_name: '',
                  contract_address: '',
                  method: '',
                  params: '',
                  uuid: ''
                }
              }
            });
        }

        // 2. Insert new branded_tokenIds in table and fetch transaction hashes with Ids in des table
        // let transactionHashesWithTypeIds = await oThis.fetchTransactionHashesTypeIds(transactionTypeHashList);

        // 3. Insert into transaction Hashes type Ids into des table
        // await oThis.updateTransactionHashTypeIds(transactionHashesWithTypeIds);

        // 4. Back to step 1
        offset += BatchSize;
        logger.log('Offset completed', offset);

        await oThis.waitForTime(WAIT_TIME);
      }

    } catch (err) {
      logger.notify("migration_for_trx_type", 'Transaction_type_migration :: process', err, offset);
    }
  },

  waitForTime: function(waitTime) {
    return new Promise(function(resolve){
      setTimeout(function () {
        resolve();
      }, waitTime);
    });
  },

  /**
   * createTransactionTypeHashList
   * @param offset
   * @param batchSize
   * @return {Promise<Array>}
   */
  createTransactionTypeHashList: async function (offset, batchSize) {
    const oThis = this
      , transactionHashTypeIdList = []
    ;

    let transactionTypeResponse = await new TransactionTypeKlass(oThis.src_chain_id).select(['transaction_hash', 'transaction_type_id'])
      .order_by('transaction_hash')
      .offset(offset)
      .limit(batchSize)
      .fire();

    if (!transactionTypeResponse) {
      logger.error("migration :: createTransactionTypeHashList :: unexpected transactionTypeResponse :: ", transactionTypeResponse);
      throw "migration :: createTransactionTypeHashList :: unexpected transactionTypeResponse";
    }

    if (transactionTypeResponse.length < 1) {
      logger.log("transaction done with processing");
      return transactionHashTypeIdList;
    }

    let transactionTypeIds = [];
    for (let index = 0; index < transactionTypeResponse.length; index++) {
      transactionTypeIds.push(transactionTypeResponse[index].transaction_type_id);
    }

    //Look for contract and type details from Id
    let transactionTypeIdResponse = await new TransactionTypeIdKlass(oThis.src_chain_id).select(['id', 'contract_address', 'transaction_type'])
      .where(['id IN (?)', transactionTypeIds])
      .order_by('id')
      .fire();

    if (!transactionTypeIdResponse || transactionTypeIdResponse.length < 1) {
      throw "migration :: transactionTypeIdResponse :: unexpected transactionTypeIdResponse";
    }

    let transactionIdsHash = {};
    for (let index = 0; index < transactionTypeIdResponse.length; index++) {
      let typeIdHash = transactionTypeIdResponse[index];
      transactionIdsHash[typeIdHash.id] = typeIdHash;
    }

    for (let index = 0; index < transactionTypeResponse.length; index++) {
      let txnTypeHash = transactionTypeResponse[index]
        , txnIdHash = transactionIdsHash[txnTypeHash.transaction_type_id];

      transactionHashTypeIdList.push({
        transaction_hash: txnTypeHash.transaction_hash,
        contract_address: txnIdHash.contract_address,
        transaction_type: txnIdHash.transaction_type
      });
    }

    return transactionHashTypeIdList;
  },

  /**
   * fetchTransactionHashesTypeIds
   * @param transactionTypeHashList
   * @return {Array}
   */
  fetchTransactionHashesTypeIds: async function (transactionTypeHashList) {
    const oThis = this
      , transactionHashesWithTypeIds = []
    ;

    let contractAddressList = [];
    for (let index = 0; index < transactionTypeHashList.length; index++) {
      let txnTypeHash = transactionTypeHashList[index];
      contractAddressList.push(txnTypeHash.contract_address);
    }

    logger.debug("Address List ::", contractAddressList);

    //Get Address hash id map
    let addressHashIdMap = await oThis.getAddressHashIdMap(contractAddressList);

    // Format and insert the contract address and its type

    let selectContractList = [];
    let selectTxnTypeList = [];
    let contractTypeHash = {};
    for (let index = 0; index < transactionTypeHashList.length; index++) {
      let txnTypeHash = transactionTypeHashList[index];
      if (!addressHashIdMap[txnTypeHash.contract_address]) {
        logger.error("Id not found of address ::", txnTypeHash.contract_address);
        throw "Id not found of address ::" + txnTypeHash.contract_address;
      } else {
        selectContractList.push(addressHashIdMap[txnTypeHash.contract_address]);
        selectTxnTypeList.push(txnTypeHash.transaction_type);
        contractTypeHash[addressHashIdMap[txnTypeHash.contract_address]] = txnTypeHash.transaction_type;
      }
    }

    //check already inserted values
    let bTTxnTypeCheckResponse = await new BrandedTokenTransactionTypeKlass(oThis.des_chain_id)
      .select(['id', 'contract_address_id', 'transaction_type'])
      .where(['contract_address_id in (?) AND transaction_type in (?)', selectContractList, selectTxnTypeList])
      .fire();

    if (!bTTxnTypeCheckResponse) {
      logger.error("fetchTransactionHashesTypeIds :: bTTxnTypeCheckResponse is :", bTTxnTypeCheckResponse);
      throw "fetchTransactionHashesTypeIds :: bTTxnTypeCheckResponse is null";
    }

    let filteredFormattedList = [];
    let filteredContractList = [];
    let filteredTxnTypeList = [];
    for (let index = 0; index < transactionTypeHashList.length; index++) {
      let txnTypeHash = transactionTypeHashList[index];
      if (!addressHashIdMap[txnTypeHash.contract_address]) {
        logger.error("Id not found of address ::", txnTypeHash.contract_address);
        throw "Id not found of address ::" + txnTypeHash.contract_address;
      } else {
        let txnType = contractTypeHash[addressHashIdMap[txnTypeHash.contract_address]];
        if (!txnType || String(txnTypeHash.transaction_type) !== String(txnType)) {
          filteredFormattedList.push([addressHashIdMap[txnTypeHash.contract_address], txnTypeHash.transaction_type]);
          filteredContractList.push(addressHashIdMap[txnTypeHash.contract_address]);
          filteredTxnTypeList.push(txnTypeHash.transaction_type);
        }
      }
    }

    //Insert into Branded token transaction type table
    await new BrandedTokenTransactionTypeKlass(oThis.des_chain_id)
      .insertMultiple(BrandedTokenTransactionTypeKlass.DATA_SEQUENCE_ARRAY, filteredFormattedList, {insertWithIgnore: true})
      .fire();

    //Select Ids of inserted Branded tokens

    let bTTxnTypeResponse = await new BrandedTokenTransactionTypeKlass(oThis.des_chain_id)
      .select(['id', 'contract_address_id', 'transaction_type'])
      .where(['contract_address_id=? AND transaction_type=?', filteredContractList, filteredTxnTypeList])
      .fire();

    if (!bTTxnTypeResponse || bTTxnTypeResponse.length < 1) {
      logger.error("fetchTransactionHashesTypeIds :: bTTxnTypeResponse is :", bTTxnTypeResponse);
      throw "fetchTransactionHashesTypeIds :: bTTxnTypeResponse is null";
    }

    let contractHashTypeIdMap = {};
    for (let index = 0; index < bTTxnTypeResponse.length; index++) {
      let btTxnType = bTTxnTypeResponse[index];
      contractHashTypeIdMap[String(btTxnType.transaction_type + btTxnType.contract_address_id)] = btTxnType.id;
    }

    for (let index = 0; index < transactionTypeHashList.length; index++) {
      let txnTypeHash = transactionTypeHashList[index];
      if (!addressHashIdMap[txnTypeHash.contract_address]) {
        logger.error("Id not found of address ::", txnTypeHash.contract_address);
        throw "Id not found of address ::" + txnTypeHash.contract_address;
      } else {
        let contract_address_id = addressHashIdMap[txnTypeHash.contract_address];
        transactionHashesWithTypeIds.push({
          transaction_hash: txnTypeHash.transaction_hash,
          branded_token_transaction_type_id: contractHashTypeIdMap[String(txnTypeHash.transaction_type + contract_address_id)]
        });
      }
    }

    return transactionHashesWithTypeIds;
  },

  /**
   * updateTransactionHashTypeIds
   * @param transactionHashesWithTypeIds
   * @return {Promise<void>}
   */
  updateTransactionHashTypeIds: async function (transactionHashesWithTypeIds) {
    const oThis = this
    ;

    for (let index; index< transactionHashesWithTypeIds;index ++) {
      let txnHashWithTypeId = transactionHashesWithTypeIds[index];
      await new TransactionHashesKlass(oThis.des_chain_id)
        .update({branded_token_transaction_type_id: txnHashWithTypeId.branded_token_transaction_type_id})
        .where({transaction_hash: txnHashWithTypeId.transaction_hash})
        .fire();
    }

  },

  /**
   * getAddressHashIdMap
   * @param contractAddressList
   * @return {Promise<void>}
   */
  getAddressHashIdMap: async function (contractAddressList) {
    const oThis = this
      , addressHashIdMap = {}
    ;
    const response = await new AddressesIdMapCacheKlass({
      chain_id: oThis.des_chain_id,
      addresses: contractAddressList
    }).fetch()
      , responseData = response.data;
    if (response.isSuccess()) {
      //logger.log('DEBUG TransactionProcessor :: getAddressHashIdMap :: Success Data', JSON.stringify(response.data));
      for (let key in responseData) {
        addressHashIdMap[key] = responseData[key].id;
      }
      return addressHashIdMap;
    } else {
      logger.error("TransactionTypeMigrationKlass :: getAddressHashIdMap response failure");
      throw "TransactionTypeMigrationKlass :: getAddressHashIdMap response failure";
    }
  }
};


module.exports = TransactionTypeMigrationKlass;
/*
  let TxnTypeMigrationKlass = require('./migration_code/transaction_type_migration.js');
  new TxnTypeMigrationKlass({src_chain_id: 201, des_chain_id: 199}).perform().then(console.log);


  BrandedTokenTransactionTypeKlass = require('./app/models/branded_token_transaction_type.js');
  new BrandedTokenTransactionTypeKlass(1409).select(['id','contract_address_id', 'transaction_type']).where(['contract_address_id IN (?) AND transaction_type IN (?)',[[2,'Upvote'],[3,'Comment'],[1,'Sachin']]]).fire();
  new BrandedTokenTransactionTypeKlass(1409).select(['id','contract_address_id', 'transaction_type']).where(['contract_address_id IN (?) AND transaction_type IN (?)',[2,3,1],['Upvote','Comment','Sachin']]).fire().then(console.log).catch(console.log);
 */