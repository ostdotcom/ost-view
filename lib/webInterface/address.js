"use strict"

const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
;

const accountHashLenght = 42
const transactionHashLength = 66

var address = {

	getAddressData : function(hash){

		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != accountHashLenght) {

				reject('invalid input');
			}

			resolve(getDummyAddress(hash));
		})

		
	}

	,getAddressBalance : function (hash) {

		return new Promise(function(resolve, reject){
			if (hash == undefined || hash.length != accountHashLenght) {
				reject('invalid input');
			}

			resolve(getDummyAddress(hash));
		})

		
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

function getDummyAddress(address) {

	var address = {
		balance : 320
	}

	return responseHelper.successWithData( address );
}

function getDummyAddressTransactions(address, page) {

	var addressParam = {
		'address' : address,
		'page' : page

	}

	return responseHelper.successWithData( addressParam );
}

module.exports = address;