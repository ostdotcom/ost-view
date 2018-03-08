const moment = require('moment')
  ,  bigNumber = require('bignumber.js');
  ;

const preRoot = "../",
     erc20Tokens = require(preRoot + '/lib/contract_interact/contractDecoder');


module.exports = {

  getMethodNameFromInputData: function (inputData){
    return erc20Tokens.decodeMethodFromInputData(inputData);
  },

  toJSON: function (object) {
    return JSON.stringify(object);
  },

  toDate: function (timestamp) {
    const formattedDate = moment(timestamp * 1000).format("MM/DD/YYYY  h:mm:ss a");
    return formattedDate;
  },

  toTimeAgo: function (timestamp){
    const formattedDate = moment((timestamp * 1000)).startOf('day').fromNow();

    return formattedDate;
  },

  math: function (lvalue, operator, rvalue){
    lvalue = parseFloat(lvalue);
    rvalue = parseFloat(rvalue);

    var value =  {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": lvalue * rvalue,
      "/": lvalue / rvalue,
      "%": lvalue % rvalue
    }[operator];

    if (isNaN(value)){
      return '0';
    }else{
      return new bigNumber(value.toString()).toFormat(5);
    }
  },

  randomStr: function(){
    return Math.random().toString(36).replace(/[^a-z]+/g, '');
  },

  block: function (name) {
    var blocks  = this._blocks,
      content = blocks && blocks[name];

    return content ? content.join('\n') : null;
  },

  contentFor: function (name, options) {
    var blocks = this._blocks || (this._blocks = {}),
      block  = blocks[name] || (blocks[name] = []);

    block.push(options.fn(this));
  },

  bigNumber_toFromat: function(number_string){

    console.log("bigNumber_toFromat :: number_string ::" , number_string);
    if(!number_string){
      return '';
    } else {
      return new bigNumber(number_string.toString()).toFormat(5);
    }
  },

  dictionary_dataValue : function(hashKey, hash, requiredValueKey){
    if (hash){
      const hashData = hash[hashKey];
      return hashData[requiredValueKey];
    }else{
      return '';
    }

  },

  getOstBalance : function(tokens, addresssContract, contractArray){
    if (contractArray) {
      var price = contractArray[addresssContract].price;
      var ostValue = tokens * price;

      var bigNumberValue = new bigNumber(ostValue.toString()).toFormat(5);
      return '('+bigNumberValue+' OST)';
    }else{
      return '';
    }

  }

};