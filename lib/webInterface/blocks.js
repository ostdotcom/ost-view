"use strict";

//All modeules required.
const reqPrefix           = "../.."
    , responseHelper      = require(reqPrefix + "/lib/formatter/response" )
    , utility_interact = require(reqPrefix + "/lib/web3/interact/utility_interact")
    , logger = require(reqPrefix + '/helpers/CustomConsoleLogger')
;

//constant
/** @constant {Number} */
const blockPageSize = 10;

var blocks = module.exports = function(webRPC, chainDBConfig){
  this._utilityInteractInstance = new utility_interact(webRPC);
}


blocks.prototype = {

/** 
  *gives list of blocks for given page number
  *
  *@param {Number} page - page number for getting  
  *
  *@return{Promise}
  */
	getRecentBlocks : function(page){
    const oThis = this;
    return new Promise(function(resolve, reject){
      if (page ==  undefined || isNaN(page)) {
        reject('invalid input');
        return;
      }

      if (!page || page <0) {
  			page = 0;
  		}


  		getBlocksData(page, oThis)
        .then(function(response){
          resolve(response);
        })
        .catch(function(reason){
            reject(reason)
        });
    });
	}
};


function getBlocksData(page, oThis){
  return new Promise(function(resolve, reject){

    var blocksArray = [];
    var promiseResolvers = [];

    oThis._utilityInteractInstance.getHigestBlockNumber()
      .then(function(heightBlockNumber){

           var lastServedBlockNumber = (page * blockPageSize);


            if (heightBlockNumber < lastServedBlockNumber) {
              reject("invalid page number")

              return;
            }

            var startIndex =  heightBlockNumber - lastServedBlockNumber;
            if (startIndex < 0) {
              startIndex = heightBlockNumber;
            }
            var endIndex = (startIndex-blockPageSize);
            if (endIndex < 0) {
              endIndex = 0;
            }

            for (var i = startIndex; i > endIndex; i--){

              promiseResolvers.push(oThis._utilityInteractInstance.getBlock(i));
           
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
