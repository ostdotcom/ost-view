"use strict"

var address = {

	getAddressData : function(address){

		if (address == undefined) {
			return;
		}

		return  getDummyAddress(address)
	}

	,getAddressBalance : function (address) {
		if (address == undefined) {
			return;
		}

		return  getDummyAddress(address)
	}

	,getAddressTransactions : function (address, page){
		if (address == undefined) {
			return;
		}

		if (page == undefined || !page || isNaN(page) || page < 0) {
			page = 0;
		}

		return getDummyAddressTransactions(address, page);
	}
}

function getDummyAddress(address) {

	var address = {
		balance : 320
	}

	return address
}

function getDummyAddressTransactions(address, page) {

	var addressParam = {
		'address' : address,
		'page' : page

	}

	return addressParam
}

module.exports = address;