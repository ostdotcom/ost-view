const moment = require('moment');

const preRoot = "../",
     erc20Tokens = require(preRoot + '/lib/contract_interact/erc20Token');


module.exports = {

  getMethodNameFromInputData: function (inputData){
    return erc20Tokens.decodeMethodFromInputData(inputData);
  },

  toJSON: function (object) {
    return JSON.stringify(object);
  },

  toDate: function (timestamp) {
    const formattedDate = moment(timestamp * 1000).format("MM/DD/YYYY h:mm:ss");
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
  }

}