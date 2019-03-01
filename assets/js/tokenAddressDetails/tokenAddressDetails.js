/**
 * Created by Aniket on 08/02/18.
 */
(function(window, $) {
  var btx = ns('btx');

  var oThis = (btx.tokenAddressDetails = {
    config: {},

    init: function(config) {
      var oThis = this;
      $.extend(oThis.config, config);

      new btx.SimpleDataTable({
        jParent: $('#token-address-transaction-table')
      });
    }
  });
})(window, jQuery);
