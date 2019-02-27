/**
 * Created by Aniket on 26/02/18.
 */

(function(window, $) {
  var btx = ns('btx');

  var oThis = (btx.home = {
    config: {},
    homeTokenTransactionTable: null,
    homeTopTokensTable: null,

    init: function(config) {
      $.extend(oThis.config, config);
      oThis.initTopTokenTable();
      oThis.bindEvents();
    },

    initTopTokenTable: function() {
      oThis.homeTopTokensTable = new btx.SimpleDataTable({
        jParent: $('#homeTopTokensTable')
      });
    },

    initTokenTransactionTable: function() {
      oThis.homeTokenTransactionTable = new btx.SimpleDataTable({
        jParent: $('#homeTokenTransactionTable')
      });
    },

    bindEvents: function() {
      $('#latestTokenTransferTab').on('click.simpleDataTable', function() {
        $(this).off('click.simpleDataTable');
        oThis.initTokenTransactionTable();
      });
    }
  });
})(window, jQuery);
