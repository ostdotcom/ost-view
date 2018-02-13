"use strict";


function ConfigHelper() {
    this.contractIdMap = {};
    this.idContractMap = {};
}

/**
 *  To sync up contractId and idContract Map
 */
ConfigHelper.prototype.syncUpContractMap = function(dbInteract) {
    var oThis = this;
    return dbInteract.getBrandedTokenDetails()
        .then(function(btResult) {
            btResult.forEach(function(contractHash){
                oThis.contractIdMap[contractHash.contract_address] = contractHash.id;
                oThis.idContractMap[contractHash.id] = contractHash.contract_address;
            });
        });
};


ConfigHelper.prototype.getIdOfContract = function(contract_address) {
    return this.contractIdMap[contract_address];
};

ConfigHelper.prototype.getContractOfId = function(contract_id) {
    return this.idContractMap[contract_id];
};

module.exports = new ConfigHelper();