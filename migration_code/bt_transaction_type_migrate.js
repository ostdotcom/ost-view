"use strict";

const rootPrefix = ".."
  , AddressIdMapCacheKlass = require(rootPrefix + "/lib/cache_multi_management/addressIdMap")
  , BrandedTokenTransactionTypeKlass = require(rootPrefix + "/app/models/branded_token_transaction_type")
  , oldTransactionTypeIdKlass = require(rootPrefix + "/migration_code/transaction_type_id")
  , tempChainId = 2000
  , chainId = 2000
;

const BTTransactionTypeMigrationKlass = function(){

};

BTTransactionTypeMigrationKlass.prototype = {
  perform: async function(){

    let offset = 0;
    let BtHashMap = {};

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
        BtHashMap[rec['contract_address']] = BtHashMap[rec['contract_address']] || {};
        BtHashMap[rec['contract_address']][rec['id']] = rec['transaction_type'];
      }
      offset += batchSize;

    }

    let contractAddresses = Object.keys(BtHashMap);

    for(var i=0;i<contractAddresses.length/100;i++){
      console.log("Batch started "+ i);
      const arr = contractAddresses.slice(i*100, (i+1)*100);
      let CacheResp = await new AddressIdMapCacheKlass({chain_id: chainId, addresses: arr}).fetch();
      let addressMap = CacheResp.data;
      let dataToInsert = [];
      for(var j=0;j<arr.length;j++){
        let ca = arr[j];
        let btMap = BtHashMap[ca];
        if(addressMap[ca]){
          for(var key in btMap){
            var val = btMap[key];
            dataToInsert.push([addressMap[ca].id, val]);
          }
        }
      }
      if(dataToInsert.length > 0){
        console.log("Insert Transaction type for batch " + i);
        await new BrandedTokenTransactionTypeKlass(chainId)
          .insertMultiple(BrandedTokenTransactionTypeKlass.DATA_SEQUENCE_ARRAY, dataToInsert, {insertWithIgnore: true})
          .fire();
        console.log("Insert ended for Transaction type for batch " + i);
      }
    }
  }
};

module.exports = BTTransactionTypeMigrationKlass;
new BTTransactionTypeMigrationKlass().perform();