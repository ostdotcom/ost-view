/**
 * Created by Aniket on 26/02/18.
 */


;(function ( window, $){

  var btx  = ns("btx");

  var oThis = btx.tokenDetails = {

    config: {},

    init: function ( config ) {
      var oThis = this;
      $.extend(oThis.config, config);
      oThis.initDatatable();
    },

    initDatatable: function(){
      var oThis = this;
      var recentTokenTransactions = new TokenTable({
        ajaxURL: oThis.config.latest_token_transfer_url,
        selector: '#homeRecentTokenTransactions',
        dtConfig : {
          columns: [
            {
              data: null,
              render: function(data, type, full, meta){

                return Handlebars.compile_fe($('#dt-col-1').text())({
                  symbol: oThis.config.coin_symbol,
                  name: oThis.config.coin_name
                });
              }
            },
            {
              data: null,
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-2').text())({
                  tokens: data.tokens,
                  value: 100
                });
              }
            },
            {
              data: null,
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-3').text())({
                  timestamp: moment(data.timestamp * 1000).startOf('day').fromNow()
                });
              }
            },
            {
              data: null,
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-4').text())({
                  tx: data.transaction_hash,
                  redirect_url: data.tx_redirect_url

                });
              }
            },
            {
              data: null,
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-5').text())({
                  from: data.t_from,
                  redirect_url: data.from_redirect_url

                });
              }
            },
            {
              data: null,
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-6').text());
              }
            },
            {
              data: null,
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-7').text())({
                  to: data.t_to,
                  redirect_url: data.to_redirect_url

                });
              }
            }
          ]
        },
        responseReceived: function ( response ) {


          var dataToProceess = response.data[response.data.result_type];
          var meta =  response.data.meta;

          dataToProceess.forEach(function(element) {

            var txHash = element.transaction_hash;
            var from = element.t_from;
            var to = element.t_to;

            var txURL = meta.transaction_placeholder_url;
            var addressURL = meta.address_placeholder_url;

            element['tx_redirect_url'] =  Handlebars.compile(txURL)({
              tr_hash: txHash
            });

            element['from_redirect_url'] =  Handlebars.compile(addressURL)({
              addr: from
            });

            element['to_redirect_url'] =  Handlebars.compile(addressURL)({
              addr: to
            });
          });
        }
      });

      var topTokenTransactions = new TokenTable({
        ajaxURL: oThis.config.top_tokens_url,
        selector: '#homeTopTokens',
        dtConfig: {
          columns: [
            {
              title:'',
              data: null,
              render: function (data, type, full, meta) {

                return Handlebars.compile_fe($('#dt-tokens-col-1').text())({
                 id: data.id
                });
              }
            },
            {
              title:'Token',
              data: null,
              render: function (data, type, full, meta) {

                return Handlebars.compile_fe($('#dt-tokens-col-2').text())({
                  symbol: data.company_symbol,
                  name: data.company_name,
                  redirect_url:data.token_details_redirect_url
                });
              }
            },
            {
              title:'Market Cap (OST α)',
              data: null,
              render: function (data, type, full, meta) {

                return Handlebars.compile_fe($('#dt-tokens-col-3').text())({
                  market_cap: data.market_cap,
                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {

                return Handlebars.compile_fe($('#dt-tokens-col-4').text())({
                  price: data.price,
                });
              }
            },
            {
              data: null,
              render: function (data, type, full, meta) {

                return Handlebars.compile_fe($('#dt-tokens-col-5').text())({
                  circulating_supply: data.circulation,
                });
              }
            },
          ]
        },

        responseReceived: function ( response ) {
          console.log("came here")

          var dataToProceess = response.data[response.data.result_type];
          var meta =  response.data.meta;

          dataToProceess.forEach(function(element) {

            var contractAddress = element.contract_address;

            var tokenDetailsURL = meta.token_details_redirect_url;
            console.log("tokenDetailsURL :: ",tokenDetailsURL);

            element['token_details_redirect_url'] =  Handlebars.compile(tokenDetailsURL)({
              contract_addr: contractAddress
            });
            element['price'] = 1/element.price;

          });
        }
      });
    }

  }
})(window, jQuery);