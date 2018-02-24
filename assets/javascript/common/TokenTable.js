;(function (window, $) {

  var TokenTable = function ( config ) {

    var oThis = this;
    $.extend( true, oThis, config );
    oThis.loadDataTable();

  };

  TokenTable.prototype = {

    constructor: TokenTable,
    selector: null,
    ajaxURL: null,
    dtConfig: {
      bLengthChange: false,
      searching: false,
      processing: true,
      serverSide: true,
      autoWidth: false
    },

    loadDataTable: function(){
      var oThis = this;
      oThis.dtConfig.ajax = function (data, callback, settings) {
        $.ajax({
          url: oThis.ajaxURL,
          success: function (response) {
            oThis.responseReceived.apply( oThis, arguments );
            callback({
              data: response.data[response.data.result_type],
              recordsTotal: response.data.recordsTotal,
              draw: response.data.draw,
              meta: response.data.meta
            });
          }
        })
      };
      $(oThis.selector).DataTable(oThis.dtConfig);
    },

    responseReceived: function ( response ) {

    }

  };

  window.TokenTable = TokenTable;

})(window, jQuery);
