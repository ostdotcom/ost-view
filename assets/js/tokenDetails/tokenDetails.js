(function(window, $) {
  var btx = ns('btx');

  var oThis = (btx.tokenDetails = {
    config: {},
    tokenTransferTable: null,
    homeTopTokensTable: null,
    init: function(config) {
      var oThis = this;
      $.extend(oThis.config, config);

      oThis.initDataTables();
    },

    initDataTables: function() {
      oThis.tokenTransferTable = new btx.SimpleDataTable({
        jParent: $('#tokenTransferTable')
      });

      $('#tokenHoldersTab').on('click.simpleDataTable', function() {
        oThis.homeTopTokensTable = new btx.SimpleDataTable({
          jParent: $('#tokenHoldersTable')
        });
        $(this).off('click.simpleDataTable');
      });
    }
  });
})(window, jQuery);
