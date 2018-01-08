"use strict"

const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , stContractInteract = require(reqPrefix + "lib/contract_interact/simpleToken")
   	, utilityInteract = require(reqPrefix + "lib/web3/interact/utility")

;

const accountHashLenght = 42
const transactionHashLength = 66

var address = {

	getAddressData : function(hash){
		var oThis = this;
		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != accountHashLenght) {

				reject('invalid input');
			}
			console.log(hash);

			oThis.getAddressBalance(hash)
				.then(function(response){
					resolve (response);
				})
				.catch(function(reason){
					reject (reason);

				})
		});

	},

	getAddressBalance : function (hash) {

		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != accountHashLenght) {

				reject('invalid input');
			}
			return utilityInteract._getBalance(hash, stContractInteract)
				.then(function(response){
					resolve (response);
				})
				.catch(function(reason){
					reject (reason);
				});
		});	
	}

	,getAddressTransactions : function (hash, page){

		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != transactionHashLength ) {
				reject('invalid input');
			}

			if (page == undefined || !page || isNaN(page) || page < 0) {
				page = 0;
			}

			resolve(getDummyAddressTransactions(hash, page));	
		})

		
	}
}


function getDummyAddressTransactions(address, page) {

	var addressParam = {
		'address' : address,
		'page' : page

	}

	return responseHelper.successWithData( addressParam );
}

module.exports = address;