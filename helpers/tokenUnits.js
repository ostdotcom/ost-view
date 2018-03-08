'use strict';
/**
 * Token Units to manage units of tokens and operations over it.
 */
var BigNumber = require('bignumber.js');

BigNumber.config({  DECIMAL_PLACES: 18,
                    ROUNDING_MODE: 4,
                    FORMAT: {
                        decimalSeparator: '.',
                        groupSeparator: ',',
                        groupSize: 3,
                        secondaryGroupSize: 0,
                        fractionGroupSeparator: ' ',
                        fractionGroupSize: 0
                    }});

var tokenUnits = function() {};
tokenUnits.unitMap = {
    'wei'           : '1',
    'kwei'          : '1000',
    'mwei'          : '1000000',
    'gwei'          : '1000000000',
    'microether'    : '1000000000000',
    'milliether'    : '1000000000000000',
    'ether'         : '1000000000000000000',
    'kether'        : '1000000000000000000000',
    'mether'        : '1000000000000000000000000',
    'gether'        : '1000000000000000000000000000',
    'tether'        : '1000000000000000000000000000000'
};

tokenUnits.getValueOfUnit = function(unit) {
    unit = unit ? unit.toLowerCase() : 'ether';
    var unitValue = this.unitMap[unit];
    if (unitValue === undefined) {
        throw new Error(globalFuncs.errorMsgs[4] + JSON.stringify(this.unitMap, null, 2));
    }
    return new BigNumber(unitValue, 10);
};

tokenUnits.fiatToWei = function(number, pricePerEther) {
    var returnValue = new BigNumber(String(number)).div(pricePerEther).times(this.getValueOfUnit('ether')).round(0);
    return returnValue.toString(10);
};

tokenUnits.toFiat = function(number, unit, multi) {
    var returnValue = new BigNumber(this.toEther(number, unit)).times(multi).round(5);
    return returnValue.toString(10);
};

tokenUnits.etherToFiat = function(number, multi) {
    return tokenUnits.toFiat(number,"ether",multi);
};

tokenUnits.toEther = function(number, unit) {
    var returnValue = new BigNumber(this.toWei(number, unit)).div(this.getValueOfUnit('ether'));
    return returnValue.toString(10);
};

tokenUnits.weiToEther = function(number) {
    return tokenUnits.toEther(number, "wei");
};

tokenUnits.toWei = function(number, unit) {
    var returnValue = new BigNumber(String(number)).times(this.getValueOfUnit(unit));
    return returnValue.toString(10);
};

tokenUnits.add = function(num1, num2) {
    var returnValue = new BigNumber(String(num1)).plus(new BigNumber(String(num2)));
    return returnValue.toString(10);
};

tokenUnits.sub = function(num1, num2) {
    var returnValue = new BigNumber(String(num1)).minus(new BigNumber(String(num2)));
    return returnValue.toString(10);
};

tokenUnits.toBigNumber = function(num) {

    if (typeof num === BigNumber){
        return num;
    }

    if(num == undefined || num == null) {
        num = 0;
    }
    return new BigNumber(num.toString());
};

tokenUnits.convertToBigNumber= function (number) {
    return (number instanceof BigNumber) ? number : this.toBigNumber(number);
};

tokenUnits.convertToNormal = function (numInWei) {
    return this.convertToBigNumber(numInWei).div(this.convertToBigNumber(10).toPower(18));
};

tokenUnits.convertToGwei = function (numInWei) {
    return this.convertToBigNumber(numInWei).div(this.convertToBigNumber(10).toPower(9));
};

module.exports = tokenUnits;