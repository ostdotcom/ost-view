"use strict";

const rootPrefix = ".."
  , AddressIdMapCacheKlass = require(rootPrefix + "/lib/cache_multi_management/addressIdMap")
  , BrandedTokenTransactionTypeKlass = require(rootPrefix + "/app/models/branded_token_transaction_type")
  , oldTransactionTypeIdKlass = require(rootPrefix + "/migration_code/transaction_type_id")
  , oldTransactionTypeKlass = require(rootPrefix + "/migration_code/transaction_type")
  , transactionHashModel = require(rootPrefix + "/app/models/transaction_hash")
  , tempChainId = 2000
  , chainId = 2000
;

const TransactionHashTypeMigrationKlass = function(){

};

TransactionHashTypeMigrationKlass.prototype = {
  perform: async function(){

    let offset = 0;
    let oldBtHashMap = {};

    const batchSize = 100;

    while(true){
      let transactionTypeResponse = await new oldTransactionTypeIdKlass(tempChainId).select(['id', 'contract_address', 'transaction_type'])
        .order_by('id')
        .offset(offset)
        .limit(batchSize)
        .fire();

      if(transactionTypeResponse.length < 1){break;}

      for(var k=0;k<transactionTypeResponse.length;k++){
        let rec = transactionTypeResponse[k];
        oldBtHashMap[rec['contract_address']] = oldBtHashMap[rec['contract_address']] || {};
        oldBtHashMap[rec['contract_address']][rec['id']] = rec['transaction_type'];
      }
      offset += batchSize;

    }

    let newBtHashMap = {};
    offset = 0;
    while(true){
      let transactionTypeResponse = await new BrandedTokenTransactionTypeKlass(chainId).select(['id', 'contract_address_id', 'transaction_type'])
        .order_by('id')
        .offset(offset)
        .limit(batchSize)
        .fire();

      if(transactionTypeResponse.length < 1){break;}

      for(var k=0;k<transactionTypeResponse.length;k++){
        let rec = transactionTypeResponse[k];
        newBtHashMap[rec['contract_address_id']] = newBtHashMap[rec['contract_address_id']] || {};
        newBtHashMap[rec['contract_address_id']][rec['transaction_type']] = rec['id'];
      }
      offset += batchSize;

    }

    let contractAddresses = Object.keys(oldBtHashMap);
    let oldIdToNewIdMap = {};

    for(var i=0;i<contractAddresses.length/100;i++){
      console.log("Batch started "+ i);
      const arr = contractAddresses.slice(i*100, (i+1)*100);
      let CacheResp = await new AddressIdMapCacheKlass({chain_id: chainId, addresses: arr}).fetch();
      let addressMap = CacheResp.data;
      for(var j=0;j<arr.length;j++){
        let ca = arr[j];
        let btMap = oldBtHashMap[ca];
        if(addressMap[ca]){
          let newContractAddressId = addressMap[ca].id;
          for(var key in btMap){
            var trxType = btMap[key];
            oldIdToNewIdMap[key] = newBtHashMap[newContractAddressId][trxType];
          }
        }
      }
    }

    // Lets migrate transaction hashes now

    for(var oldtrxTypeId in oldIdToNewIdMap){
      console.log("Old Transaction type Id to map " + oldtrxTypeId);

      let newTrxTypeId = oldIdToNewIdMap[oldtrxTypeId];
      if(!newTrxTypeId){
        throw("Transaction type id not found for old ones" + oldtrxTypeId);
      }

      let obatchOffset = 0;
      const obatchSize = 1000;
      while(true){
        let transactionsArrayResponse = await new oldTransactionTypeKlass(tempChainId).select(['transaction_hash', 'transaction_type_id'])
          .where(["transaction_type_id=?", oldtrxTypeId])
          .order_by('id')
          .offset(obatchOffset)
          .limit(obatchSize)
          .fire();

        if(transactionsArrayResponse.length < 1){break;}

        let trxToUpdate = [];
        for(var k=0;k<transactionsArrayResponse.length;k++){
          let rec = transactionsArrayResponse[k];
          trxToUpdate.push(rec['transaction_hash'].toLowerCase());
        }

        await new transactionHashModel(chainId).update({branded_token_transaction_type_id: newTrxTypeId})
          .where(['transaction_hash IN (?)', trxToUpdate])
          .fire();

        obatchOffset += obatchSize;

        console.log("Transactions updated to new type" + newTrxTypeId);

      }
    }
  }
};

module.exports = TransactionHashTypeMigrationKlass;
new TransactionHashTypeMigrationKlass().perform();