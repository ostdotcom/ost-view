"use strict";

const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , core_addresses = require( reqPrefix + "config/core_addresses")
    ,simpleTokenContractInteract = require(reqPrefix + "lib/contract_interact/simpleToken")
;

var block = {

	getBlock : function(block_number){


		return simpleTokenContractInteract.balanceOf("0x12ed0189a5174674d740e01aa56dfa114b375322")
			.then(function(response){

				console.log("******** 123 *****",response);
				resolve(response);
			})
			.catch(function(response){
			
			});


		// return new Promise(function(resolve, reject){
		// 	if (block_number == undefined || isNaN(block_number)){
		// 		reject('invalid input');
		// 	}

		// 	resolve(getDummyBlcokTransactions(address, page));
		// })
	}

	,getBlcokTransactions : function(address, page){

		return new Promise(function(resolve, reject){
			if (address == undefined || isNaN(page)){
				reject('invalid input');
			}

			if (page == undefined || !page || page < 0) {
				page = 0;
			}

			resolve(getDummyBlcokTransactions(address, page));
		})	
	}
}

function getBlockDummyData(block_number) {
	var block = {
		difficulty: 131072,
		  extraData: "0xd883010703846765746887676f312e392e328664617277696e",
		  gasLimit: 3012788,
		  gasUsed: 21000,
		  hash: "0x0778a76a37f823088d8f7fe59773bc5408e727015e7d0409fd7630ae9b4195fe",
		  logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
		  miner: "0xae877859b9ab12275d5a90f44663508e36f75d46",
		  mixHash: "0x55c63742af1be3eb90fe753547dd3ed446cd34499d32a587ecb7e0cfaa906a97",
		  nonce: "0x5b2b9b020f202799",
		  number: block_number,
		  parentHash: "0x6428737e73b396a1ae2d7df18b0f3cf7a526148be151b5c9fadda3bd9c185a02",
		  receiptsRoot: "0xb6f807e066fd4932d6e9687d3d2b93cb4f08349d3348605447ec03050ad1e5d2",
		  sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
		  size: 646,
		  stateRoot: "0x40c2fe914e8eb60ae6fb9db3a2f16bdcbf74124513207c65947873ca4652b0ff",
		  timestamp: 1514964355,
		  totalDifficulty: 49340989,
		  transactions: ["0x0e98e5f71cada976a4e1e67bb7a820ed6a5aeb9a4a5e220c9aab7594c29e2283"],
		  transactionsRoot: "0x3dab2dfbe0df5b1f550a8e0da1498326b1aef367bd55d84da2308df6531c6678",
		  uncles: []
	};

	return responseHelper.successWithData(block);
}

function getDummyBlcokTransactions(address, page){
	var blockParam = {
		'address' : address,
		'page' : page
	}

	return responseHelper.successWithData( blockParam );
}

module.exports = block;