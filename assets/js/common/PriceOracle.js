/**
 * Created by Aniket on 09/03/18.
 */

(function(scope, $) {
  var defaultPrecision = 5,
    defaultRoundMode = BigNumber.ROUND_DOWN;

  var P_OST = 5,
    P_OST_ROUND_ROUNDING_MODE = BigNumber.ROUND_HALF_UP;

  var P_BT = 5,
    P_BT_ROUND_ROUNDING_MODE = BigNumber.ROUND_HALF_UP;

  var P_FIAT = 3,
    P_FIAT_ROUND_ROUNDING_MODE = BigNumber.ROUND_HALF_UP;

  var displayFormat = {
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0
  };

  var oThis = (PriceOracle = scope.PriceOracle = {
    init: function(config) {
      var oThis = this;

      if (config.ost_precision) {
        P_OST = config.ost_precision;
      }

      if (config.bt_precision) {
        P_BT = config.bt_precision;
      }

      if (config.fiat_precision) {
        P_FIAT = config.fiat_precision;
      }

      if (config.display_format) {
        displayFormat = config.display_format;
      }

      BigNumber.config({ FORMAT: displayFormat });

      $.extend(oThis, config);
    },

    inverseBtToOst: function(btToOstRate) {
      var oThis = this;

      var ostToBt;
      if (oThis.isNaN(btToOstRate)) {
        return NaN;
      }

      btToOstRate = BigNumber(btToOstRate);
      ostToBt = BigNumber(1).dividedBy(btToOstRate);
      return oThis.toOst(ostToBt);
    },

    toEtherFromWei: function(weiValue) {
      if (!weiValue) return 0;
      var oThis = this,
        bigNumberValue = weiValue,
        conversionRatio = new BigNumber(10).pow(18);

      if (typeof weiValue !== 'BigNumber') {
        bigNumberValue = BigNumber(weiValue);
      }

      var ethValue = bigNumberValue.dividedBy(conversionRatio);

      return ethValue;
    },

    toDecimalValue: function(value, decimal) {
      if (!value) return 0;
      decimal = Number(decimal);
      if (isNaN(decimal)) {
        decimal = 18;
      }
      var valueBigNumber = new BigNumber(value),
        divider = new BigNumber(10).pow(decimal);
      return valueBigNumber.dividedBy(divider).toString(10);
    },

    toBaseValue: function(value, conversionFactor, decimal) {
      if (!value) return 0;
      decimal = Number(decimal);
      conversionFactor = conversionFactor || 1;
      if (isNaN(decimal)) {
        decimal = 18;
      }
      var valueBigNumber = new BigNumber(value),
        ostValue = valueBigNumber.dividedBy(conversionFactor),
        divider = new BigNumber(10).pow(decimal);
      return ostValue.dividedBy(divider).toString(10);
    },

    toDisplayPrecision: function(value, precision) {
      if (!value) return '';
      var bnVal = new BigNumber(value);
      if (isNaN(precision)) {
        precision = defaultPrecision;
      }
      return bnVal.decimalPlaces(precision, 1).toString();
    },

    getTransactionFee: function(gasUsed, gasPrice) {
      if (!gasUsed) {
        return '';
      }
      var txFeeBn = BigNumber(gasPrice).multipliedBy(gasUsed);
      return txFeeBn;
    },

    getDisplayTransactionFee: function(gasUsed, gasPrice) {
      var oThis = this,
        txFeeBn = oThis.getTransactionFee(gasUsed, gasPrice);
      if (txFeeBn) {
        return oThis.toEtherFromWei(txFeeBn);
      }
    },

    isNaN: function(val) {
      return isNaN(val) || val === '';
    },

    //**************** Unused Methods Start **************** //

    toOst: function(ost) {
      var oThis = this;

      if (oThis.isNaN(ost)) {
        return NaN;
      }
      ost = BigNumber(ost);
      return BigNumber(ost.toFixed(P_OST, P_OST_ROUND_ROUNDING_MODE));
    },

    toBt: function(bt) {
      var oThis = this;

      if (oThis.isNaN(bt)) {
        return NaN;
      }
      bt = oThis.toEtherFromWei(bt);
      bt = BigNumber(bt);
      return BigNumber(bt.toFixed(P_BT, P_BT_ROUND_ROUNDING_MODE));
    },

    toFiat: function(fiat) {
      var oThis = this;

      if (oThis.isNaN(fiat)) {
        return NaN;
      }
      fiat = BigNumber(fiat);
      return BigNumber(fiat.toFixed(P_FIAT, P_FIAT_ROUND_ROUNDING_MODE));
    },

    getDisplayOst: function(ost) {
      var oThis = this,
        val;
      val = oThis.toOst(ost);
      if (isNaN(val)) {
        return '';
      } else {
        return val.toFormat().toString(10);
      }
    },

    getDisplayBt: function(bt) {
      var oThis = this,
        val;
      val = oThis.toBt(bt);
      if (isNaN(val)) {
        return '';
      } else {
        return val.toFormat().toString(10);
      }
    },

    getDisplayFiat: function(fiat) {
      var oThis = this,
        val;
      val = oThis.toFiat(fiat);
      if (isNaN(val)) {
        return '';
      } else {
        return val.toFormat().toString(10);
      }
    },

    btToOst: function(bt, ostToBtRate) {
      var oThis = this;

      if (oThis.isNaN(bt)) {
        return NaN;
      }
      bt = oThis.toBt(bt);

      ostToBtRate = oThis.toOst(ostToBtRate);
      if (oThis.isNaN(ostToBtRate)) {
        return NaN;
      }

      return bt.dividedBy(ostToBtRate);
    },

    getDisplayBtToOstPrice: function(ostToBtPrice) {
      var oThis = this,
        displayPrice = 0,
        btQuantity = BigNumber(1),
        bigNumberValue = ostToBtPrice;
      if (typeof ostToBtPrice !== 'BigNumber') {
        bigNumberValue = BigNumber(ostToBtPrice);
      }

      displayPrice = btQuantity.dividedBy(bigNumberValue);
      return oThis.getDisplayOst(displayPrice);
    },

    inverseDisplayBtToOst: function(bt, btToOstRate) {
      var oThis = this;

      var ostToBtRate = oThis.inverseBtToOst(btToOstRate);
      return oThis.getDisplayBtToOst(bt, ostToBtRate);
    },

    getDisplayBtToOst: function(bt, ostToBtRate) {
      var oThis = this;

      var displayBt = oThis.btToOst(bt, ostToBtRate);
      return oThis.getDisplayOst(displayBt);
    }

    //**************** Unused Methods END ****************//
  });
})(window, jQuery);
