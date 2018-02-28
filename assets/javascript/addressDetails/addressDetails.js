/**
 * Created by Aniket on 08/02/18.
 */
;(function ( window, $) {

  var btx = ns("btx");

  var oThis = btx.addressDetails = {
    config: {},

    init: function ( config ) {
      var oThis = this;
      $.extend(oThis.config, config);

      oThis.initDatatable();
    },

    initDatatable: function() {
      var oThis = this;

      var addressTransactions = new TokenTable({
        ajaxURL: oThis.config.transactions_url,
        selector: '#addressDetailsTransactions',
        dtConfig: {
          columns: [
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-1').text())({
                  symbol: 'AKC',
                  name: 'Akshay Coin'
                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-2').text())({
                  tokens: data.tokens,
                  value: 100
                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-3').text())({
                  timestamp: moment(data.timestamp * 1000).startOf('day').fromNow()
                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-4').text())({
                  tx: data.transaction_hash,
                  redirect_url: data.tx_redirect_url

                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-5').text())({
                  from: data.address,
                  redirect_url: data.from_redirect_url

                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-6').text());
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-7').text())({
                  to: data.corresponding_address,
                  redirect_url: data.to_redirect_url

                });
              }
            }
          ]
        },

        responseReceived : function ( response ) {
          var dataToProceess = response.data[response.data.result_type];
          const meta = response.data.meta;


          dataToProceess.forEach(function (element) {
            const txHash = element.transaction_hash;
            const from = element.address;
            const to = element.corresponding_address;

            const txURL = meta.transaction_placeholder_url;
            const addressURL = meta.address_placeholder_url;

            element['tx_redirect_url'] = Handlebars.compile(txURL)({
              tr_hash: txHash
            });

            element['from_redirect_url'] = Handlebars.compile(addressURL)({
              addr: from
            });
            element['to_redirect_url'] = Handlebars.compile(addressURL)({
              addr: to
            });
          });
        }
      });
    }

  }
})(window, jQuery);