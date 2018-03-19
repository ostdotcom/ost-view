"use strict";

const crypto = require('crypto')
;

const Util = function () {};

Util.prototype = {

  constructor: Util,

  formatDbDate: function (dateObj) {
    function pad(n) {
      return n<10 ? "0"+n : n
    }

    return dateObj.getFullYear()+"-"+
      pad(dateObj.getMonth()+1)+"-"+
      pad(dateObj.getDate())+" "+
      pad(dateObj.getHours())+":"+
      pad(dateObj.getMinutes())+":"+
      pad(dateObj.getSeconds())
  },

  invert: function(json){
    var ret = {};
    for(var key in json){
      ret[json[key]] = key;
    }
    return ret;
  },

  clone: function (obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  asciiToHex: function (str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n ++)
    {
      var hex = Number(str.charCodeAt(n)).toString(16);
      arr1.push(hex);
    }
    return "0x"+arr1.join('');
  },

  /**
   * Generate Random Passphrase.
   *
   * @return {string}
   */
  generatePassphrase: function (length) {
    length = length || 30;

    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@%*#^*",
      retVal = "";

    for (var i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }

    return retVal;
  }

};

module.exports = new Util;