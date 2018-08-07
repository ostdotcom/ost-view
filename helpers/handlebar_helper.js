const moment = require('moment')
  ,  bigNumber = require('bignumber.js')
;

const rootPrefix = "../",
     erc20Tokens = require(rootPrefix + '/lib/contract_interact/contractDecoder')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

module.exports = {
  isNODE_ENV_PROD : function(options){
    if(process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() == 'production') {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  getMethodNameFromInputData: function (inputData){
    return erc20Tokens.decodeMethodFromInputData(inputData);
  },

  toJSON: function (object) {
    return JSON.stringify(object);
  },

  toDate: function (timestamp) {
    if ( timestamp ){
      const formattedDate = moment(timestamp * 1000).utc().format("MM/DD/YYYY  h:mm:ss a z");
      return formattedDate;
    }else{
      return '';
    }
  },

  toTimeAgo: function (timestamp){
    const formattedDate = moment((timestamp * 1000)).fromNow();

    return formattedDate;
  },

  math: function (lvalue, operator, rvalue) {

    if (!rvalue || !lvalue) {
      return '';
    }

    lvalue = new bigNumber(lvalue.toString());
    rvalue = new bigNumber(rvalue.toString());

    var value =  {
      "+": lvalue.plus(rvalue),
      "-": lvalue.minus(rvalue),
      "*": lvalue.times(rvalue),
      "/": lvalue.dividedBy(rvalue),
      "%": lvalue.modulo(rvalue)
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
      if(hashData){
        return hashData[requiredValueKey];
      }
    }

    return '';
  },

  getOstBalance : function(tokens, addresssContract, contractArray){

    var precision = Number( precision );
    if ( isNaN( precision ) || !precision ) {
      precision = 5;
    }

    if (contractArray[addresssContract]) {
      var price = contractArray[addresssContract].conversion_rate
        , ostValue = new bigNumber(tokens).div(new bigNumber(price))
        , bigNumberDivisor = new bigNumber(10).toPower(18)
        , ostValueToEth = ostValue.dividedBy(bigNumberDivisor)
        , bigNumberValue = ostValueToEth.toFormat(precision)
      ;
      return bigNumberValue;
    }else{
      return '';
    }
  },

  /**
   * OST Currency Symbol
   *
   * @return {String}
   */
  ostCurrencySymbol: function(withoutFormatting) {
    if(coreConstants.VIEW_SUB_ENVIRONMENT == 'main'){
      return 'OST'
    } else {
      if(withoutFormatting) {
        return 'OST ⍺'
      } else {
        return 'OST <span class="text-lowercase">⍺</span>'
      }
    }
  },

  getBtBalance: function(amount, precision) {
    precision = Number( precision );
    if ( isNaN( precision ) || !precision ) {
      precision = 5;
    }
    if (amount){
      var bigNumberAmount = new bigNumber(amount)
        , bigNumberDivisor = new bigNumber(10).toPower(18)
      ;
      return bigNumberAmount.div(bigNumberDivisor).toFormat(precision).toString(10);
    }else{
      return  new bigNumber(0).toFormat(precision).toString(10);
    }
  },

  toOSTAlpha : function(amount, precision){
    precision = Number( precision );
    if ( isNaN( precision ) || !precision ) {
      precision = 5;
    }
    if (amount){
      var bigNumberAmount = new bigNumber(amount)
        , bigNumberDivisor = new bigNumber(10).toPower(18)
      ;
      return bigNumberAmount.div(bigNumberDivisor).toFormat(precision).toString(10);
    }else{
      return  new bigNumber(0).toFormat(precision).toString(10);
    }
  },

  toOstGasPrice : function(amount){
    if (amount){
      var bigNumberAmount = new bigNumber(amount)
      var bigNumberDivisor = new bigNumber(10).toPower(18);
      return bigNumberAmount.div(bigNumberDivisor).toString(10);
    }else{
      return  new bigNumber(0).toString(10);
    }
  },


  toGWai: function(amount, precision){
    if (amount){
      var bigNumberAmount = new bigNumber(amount)
      var bigNumberDivisor = new bigNumber(10).toPower(9);
      return bigNumberAmount.div(bigNumberDivisor).toString(10);
    }else{
      return  new bigNumber(0).toString(10);
    }
  },

};