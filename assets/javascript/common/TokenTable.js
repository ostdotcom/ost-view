;(function (window, $) {

  var TokenTable = function ( config ) {

    var oThis = this;

    oThis.dtConfig = {
      "bLengthChange": false,
      "searching": false,
      "processing": true,
      "serverSide": true,
      "paging":true,
      "responsive": true,
      "autoWidth": false,
      "pagingType": 'simple',
      "language": {
        "info": "",
        "infoEmpty": "",
        "infoFiltered": "",
        "processing": "<div class='loader'></div>",
        "paginate": {
          "next": "❯",
          "previous" : "❮"
        }
      },
      "columns": [],
    };

    $.extend( true, oThis, config );

    return oThis.loadDataTable();

  };

  TokenTable.prototype = {

    constructor: TokenTable,
    selector: null,
    ajaxURL: null,
    dtConfig: null,

    loadDataTable: function(){
      var oThis = this;
      var meta;
      var payload;
      var previousStartIndex;

      oThis.dtConfig.ajax = function (data, callback, settings) {

        // Disabling pagination while ajax is in process
        $(settings.nTableWrapper).find('.dataTables_paginate').css({pointerEvents: 'none'});

        var currentStart = settings.oAjaxData.start;

        if (meta !== undefined) {

          if (currentStart > previousStartIndex) {
            payload = {page_payload: meta.next_page_payload};

            if(Object.keys(meta.next_page_payload).length <= 1) {
              $(settings.nTableWrapper).find('.dataTables_processing').hide();
              return;
            }

          } else {
            payload = {page_payload: meta.prev_page_payload};
          }

        }

        $.ajax({
          url: oThis.ajaxURL,
          data: payload,
          contentType: "application/json",
          success: function (response) {

            if(response.data){
              meta = response.data.meta;
              oThis.responseReceived.apply( oThis, arguments );
              previousStartIndex = settings.oAjaxData.start;

              var recordsFilteredCount = 0;

              if(Object.keys(meta.next_page_payload).length > 1){
                recordsFilteredCount = settings.oAjaxData.start + settings.oAjaxData.length + 1;
              }else{
                recordsFilteredCount = settings.oAjaxData.start + settings.oAjaxData.length
              }

              callback({
                data: response.data[response.data.result_type],
                meta: response.data.meta,
                recordsFiltered: recordsFilteredCount,
              });

              // Enabling pagination after ajax completion
              $(settings.nTableWrapper).find('.dataTables_paginate').css({pointerEvents: 'inherit'});
            }else {
              callback({
                data: '',
                meta: '',
                recordsFiltered: '',
              });
            }

          }
        })
      };

      return $(oThis.selector).DataTable(oThis.dtConfig);
    },

    responseReceived: function ( response ) {

    }

  };

  window.TokenTable = TokenTable;

})(window, jQuery);
