const moment = require('moment');

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

    return {
      "+": lvalue + rvalue,
      "-": lvalue - rvalue,
      "*": lvalue * rvalue,
      "/": lvalue / rvalue,
      "%": lvalue % rvalue
    }[operator];
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
  }



};