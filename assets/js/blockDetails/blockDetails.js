/**
 * Created by Akshay on 09/03/18.
 */
(function(window, $) {
  var btx = ns('btx');

  var oThis = (btx.blockDetails = {
    config: {},
    dataTable: null,

    init: function(config) {
      var oThis = this;
      $.extend(oThis.config, config);
      oThis.dataTable = new btx.SimpleDataTable({
        jParent: $('#block-transaction-table')
      });
    }
  });
})(window, jQuery);
