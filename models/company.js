'use strict';
/**
 * Model to fetch company related details from database or from chain.
 *
 * @module models/company
 */

// load all internal dependencies
const rootPrefix = ".."
    , dbInteract = require(rootPrefix + '/lib/storage/interact')
    , constants = require(rootPrefix + '/config/core_constants')
    , coreConfig = require(rootPrefix + '/config')
    ;

/**
 * @constructor
 *
 * @param {Integer} chainId - chain id to connect to respective geth node and database instance
 */
var Company =  function (chainId) {
        this._dbInstance = dbInteract.getInstance(coreConfig.getChainDbConfig(chainId));
};

module.exports = {
        newInstance: function (chainId) {
                return new Company(chainId);
        }
};


Company.prototype = {

        /**
         * Get list of Contract ledger for given contract address.
         *
         * @param {String} contractAddress - Contract address
         * @param {Integer} page  - Page number
         *
         * @return {Promise<Object>} List of contract internal transaction
         */
        getTokenTransfersGraph: function (type) {
            const oThis = this;

            return Promise.resolve(oThis.totalTransactionsData[type]);
        },

        /**
         * Get list of Contract ledger for given contract address.
         *
         * @param {String} contractAddress - Contract address
         * @param {Integer} page  - Page number
         *
         * @return {Promise<Object>} List of contract transaction
         */
        getContractTransactions: function (contractAddress, page){
                const oThis = this;

                return new Promise(function (resolve, reject) {

                        if (contractAddress == undefined || contractAddress.length != constants.ACCOUNT_HASH_LENGTH) {
                                reject("invalid input");
                                return;
                        }

                        if (page == undefined || !page || isNaN(page) || page < 0) {
                                page = constants.DEFAULT_PAGE_NUMBER;
                        }

                        oThis._dbInstance.getContractTransactions(contractAddress, page, constants.DEFAULT_PAGE_SIZE)
                            .then(function (response) {
                                    resolve(response);
                            })
                            .catch(function (reason) {
                                    reject(reason);
                            });
                });
        }

};

Company.prototype.totalTransactionsData = {
        'Hour':[
                {value:4,time:'3:00'},
                {value:3,time:'3:05'},
                {value:3,time:'3:10'},
                {value:3,time:'3:15'},
                {value:2,time:'3:20'},
                {value:4,time:'3:25'},
                {value:1,time:'3:30'},
                {value:4,time:'3:35'},
                {value:6,time:'3:40'},
                {value:1,time:'3:45'},
                {value:12,time:'3:50'},
                {value:2,time:'3:55'}
        ],
            'Day':[
                {value:14,time:'03:00'},
                {value:33,time:'04:00'},
                {value:23,time:'05:00'},
                {value:13,time:'06:00'},
                {value:32,time:'07:00'},
                {value:44,time:'08:00'},
                {value:41,time:'09:00'},
                {value:14,time:'10:00'},
                {value:56,time:'11:00'},
                {value:11,time:'12:00'},
                {value:12,time:'13:00'},
                {value:12,time:'14:00'},
                {value:12,time:'15:00'},
                {value:13,time:'16:00'},
                {value:12,time:'17:00'},
                {value:12,time:'18:00'},
                {value:22,time:'19:00'},
                {value:12,time:'20:00'},
                {value:42,time:'21:00'},
                {value:12,time:'22:00'},
                {value:52,time:'23:00'},
                {value:22,time:'24:00'},
                {value:12,time:'01:00'},
                {value:62,time:'02:00'}
        ],
            'Week':[
                {value:54,time:'1 April'},
                {value:64,time:'2 April'},
                {value:74,time:'3 April'},
                {value:40,time:'4 April'},
                {value:12,time:'5 April'},
                {value:43,time:'6 April'},
                {value:24,time:'7 April'}
        ],
            'Month':[
                {value:214,time:'1 week'},
                {value:124,time:'2 week'},
                {value:44,time:'3 week'},
                {value:440,time:'4 week'}
        ],
            'Year':[
                {value:214,time:'Jan'},
                {value:124,time:'Feb'},
                {value:44,time:'Mar'},
                {value:0,time:'Apr'},
                {value:0,time:'May'},
                {value:0,time:'Jun'},
                {value:0,time:'Jul'},
                {value:440,time:'Aug'},
                {value:40,time:'Sep'},
                {value:1240,time:'Oct'},
                {value:4410,time:'Nov'},
                {value:4240,time:'Dec'}
        ],
            'All':[]
};