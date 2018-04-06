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
        //dtConfig: {
        //  columns: [
        //    {
        //      data: null,
        //      width:'16%',
        //      render: function (data, type, full, meta) {
        //        return Handlebars.compile_fe($('#dt-col-1').text())({
        //          symbol: data.company_symbol,
        //          name: data.company_name,
        //          symbol_icon: data.symbol_icon,
        //          redirect_url: data.token_details_redirect_url
        //        });
        //      }
        //    },
        //    {
        //      data: null,
        //      width:'18%',
        //      render: function (data, type, full, meta) {
        //        return Handlebars.compile_fe($('#dt-col-2').text())({
        //          tokens: data.tokens,
        //          coin_symbol: data.company_symbol,
        //          value: data.ost_amount
        //        });
        //      }
        //    },
        //    {
        //      data: null,
        //      width:'11%',
        //      render: function (data, type, full, meta) {
        //        return Handlebars.compile_fe($('#dt-col-3').text())({
        //          timestamp: data.timestamp
        //        });
        //      }
        //    },
        //    {
        //      data: null,
        //      width:'11%',
        //      render: function (data, type, full, meta) {
        //        return Handlebars.compile_fe($('#dt-col-4').text())({
        //          tx: data.transaction_hash,
        //          redirect_url: data.tx_redirect_url
        //        });
        //      }
        //    },
        //    {
        //      data: null,
        //      width:'17%',
        //      render: function (data, type, full, meta) {
        //        return Handlebars.compile_fe($('#dt-col-5').text())({
        //          from: data.address,
        //          redirect_url: data.from_redirect_url
        //        });
        //      }
        //    },
        //    {
        //      data: null,
        //      width:'4%',
        //      render: function (data, type, full, meta) {
        //        return Handlebars.compile_fe($('#dt-col-6').text());
        //      }
        //    },
        //    {
        //      data: null,
        //      width:'17%',
        //      render: function (data, type, full, meta) {
        //        return Handlebars.compile_fe($('#dt-col-7').text())({
        //          to: data.corresponding_address,
        //          redirect_url: data.to_redirect_url
        //        });
        //      }
        //    }
        //  ]
        //},
        dtConfig: {
          columns: [
            {
              data: null,
              width:'6%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-1').text())({
                  symbol: data.company_symbol,
                  name: data.company_name,
                  symbol_icon: data.symbol_icon,
                  redirect_url: data.token_details_redirect_url
                });
              }
            },
            {
              data: null,
              width:'14%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-2-1').text())({
                  tokens: data.tokens,
                  coin_symbol: data.company_symbol,
                  value: data.ost_amount,
                  inflow: data.inflow
                });
              }
            },
            {
              data: null,
              width:'14%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-2-2').text())({
                  tokens: data.tokens,
                  coin_symbol: data.company_symbol,
                  value: data.ost_amount
                });
              }
            },
            {
              data: null,
              width:'11%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-3').text())({
                  timestamp: data.timestamp
                });
              }
            },
            {
              data: null,
              width:'11%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-4').text())({
                  tx: data.transaction_hash,
                  redirect_url: data.tx_redirect_url
                });
              }
            },
            {
              data: null,
              width:'17%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-5').text())({
                  from: data.address,
                  redirect_url: data.from_redirect_url
                });
              }
            },
            {
              data: null,
              width:'4%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-col-6').text());
              }
            },
            {
              data: null,
              width:'17%',
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
          var dataToProceess = response.data[response.data.result_type]
            , meta = response.data.meta
            , contractAddresses = response.data['contract_addresses']
            ;

          dataToProceess.forEach(function (element) {

            var txHash = element.transaction_hash
              , txURL = meta.transaction_placeholder_url
              , addressURL = meta.address_placeholder_url
              , tokenDetailsPlaceholderUrl = meta.token_details_redirect_url
              , contract_address_id = element.contract_address_id
              , contract_address = element.contract_address
              , tokens = element.tokens
              , conversion_rate = contractAddresses[contract_address_id].conversion_rate
              , timestamp = element.timestamp
              , inflow = element.inflow
              , to = inflow ? element.address : element.corresponding_address
              , from = inflow ? element.corresponding_address : element.address
            ;


            element['timestamp'] = toTimeAgo(timestamp);

            element['tx_redirect_url'] = Handlebars.compile(txURL)({
              tr_hash: txHash
            });

            element['from_redirect_url'] = Handlebars.compile(addressURL)({
              addr: from
            });
            element['to_redirect_url'] = Handlebars.compile(addressURL)({
              addr: to
            });
            element['token_details_redirect_url'] = Handlebars.compile(tokenDetailsPlaceholderUrl)({
              contract_addr: contract_address
            });

            element.corresponding_address = to;
            element.address = from;

            element['tokens'] = PriceOracle.getDisplayBt(tokens);
            element['ost_amount'] = PriceOracle.getDisplayBtToOst(tokens, conversion_rate);

            if (contractAddresses[contract_address_id]){
              element['company_name'] = contractAddresses[contract_address_id].company_name;
              element['company_symbol'] = contractAddresses[contract_address_id].company_symbol;
              element['symbol_icon'] = contractAddresses[contract_address_id].symbol_icon;
            }else {
              element['company_name'] = '';
              element['company_symbol'] = '';
              element['symbol_icon'] = '';
            }

          });
        }
      });
    }

  }
})(window, jQuery);