"use strict";

//All modeules required.
const reqPrefix           = "../../"
    , responseHelper      = require(reqPrefix + "lib/formatter/response" )
    , utility_interact = require(reqPrefix + "lib/web3/interact/utility_interact")
;

//constant
/** @constant {Number} */
const blockPageSize = 10;

var blocks = {

/** 
  *gives list of blocks for given page number
  *
  *@param {Number} page - page number for getting  
  *
  *@return{Promise}
  */
	getRecentBlocks : function(page){

    return new Promise(function(resolve, reject){

      if (page ==  undefined || isNaN(page)) {
        reject('invalid input');
        return;
      }

      if (!page || page <0) {
  			page = 0;
  		}

  		getBlocksData(page)
        .then(function(response){
          resolve(response);
        })
        .catch(function(reason){
            reject(reason)
        });
    });
	}
};


function getBlocksData(page){
  return new Promise(function(resolve, reject){

    var blocksArray = [];
    var promiseResolvers = [];
    utility_interact.getHigestBlockNumber()
      .then(function(heightBlockNumber){
           var lastServedBlockNumber = (page * maxCount);

            if (heightBlockNumber < lastServedBlockNumber) {
              reject("invalid page number")
              return;
            }

            var startIndex =  heightBlockNumber - lastServedBlockNumber;
            if (startIndex < 0) {
              startIndex = heightBlockNumber;
            }
            var endIndex = (startIndex-maxCount);
            if (endIndex < 0) {
              endIndex = 0;
            }

            for (var i = startIndex; i > endIndex; i--){

              promiseResolvers.push(utility_interact.getBlock(i));
           
            }
            Promise.all(promiseResolvers).then(function(rsp) {
              console.log(rsp)
              blocksArray = rsp;
              resolve(responseHelper.successWithData( blocksArray ));
            });
      });
    })
    .catch(function(reason){
      reject(reason);
    })
    
}

module.exports = blocks;