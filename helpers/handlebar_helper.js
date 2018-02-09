const moment = require('moment');

const preRoot = "../",
     erc20Tokens = require(preRoot + '/lib/contract_interact/erc20Token');


module.exports = {
  list: function (items) {
    var out = "<ul>";

    for (var i = 0, l = items.length; i < l; i++) {
      out = out + "<li>" + items[i].firstName + " " + items[i].lastName + "</li>";
    }

    return out + "</ul>";
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

  decodeInputData: function (inputData){
    return erc20Tokens.decodeMethodFromInputData(inputData);
  }

}