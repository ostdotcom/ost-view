/**
 * Created by Aniket on 26/02/18.
 */


;(function ( window, $){

  var btx  = ns("btx");

  var oThis = btx.home = {

    config: {},

    init: function ( config ) {
      var oThis = this;
      $.extend(oThis.config, config);
      oThis.googleCharts_1 = new GoogleCharts();
      oThis.googleCharts_2 = new GoogleCharts();
      oThis.bindButtons();
      oThis.triggerClick();
      oThis.initDatatable();
    },

    bindButtons: function(){

      $('.interval').on('click', function(){
        var $graphCard = $(this).closest('.card-graph');
        $graphCard.find('.interval').removeClass('active');
        $(this).addClass('active');
        if($graphCard.hasClass('graph-1')){
          oThis.printTransfersChart($(this).data('interval'));
        } else {
          oThis.printVolumeChart($(this).data('interval'));
        }

      });

    },

    triggerClick: function(){
      $('.graph-1 .interval[data-interval="Day"]').trigger('click');
      $('.graph-2 .interval[data-interval="Day"]').trigger('click');

    },

    initDatatable: function(){
      var oThis = this;
      oThis.recentTokenTransactions = new TokenTable({
        ajaxURL: oThis.config.latest_token_transfer_url,
        selector: '#homeRecentTokenTransactions',
        dtConfig : {
          columns: [
            {
              data: null,
              width:'16%',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-1').text())({
                  symbol: data["company_symbol"],
                  name: data["company_name"]
                });
              }
            },
            {
              data: null,
              width:'18%',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-2').text())({
                  tokens: data.tokens,
                  coin_symbol: data.company_symbol,
                  value: bigNumberToFormat(data.ost_amount)
                });
              }
            },
            {
              data: null,
              width:'11%',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-3').text())({
                  timestamp: moment(data.timestamp * 1000).startOf('day').fromNow()
                });
              }
            },
            {
              data: null,
              width:'11%',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-4').text())({
                  tx: data.transaction_hash,
                  redirect_url: data.tx_redirect_url

                });
              }
            },
            {
              data: null,
              width:'17%',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-5').text())({
                  from: data.t_from,
                  redirect_url: data.from_redirect_url

                });
              }
            },
            {
              data: null,
              width:'4%',
              className: 'arrow',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-6').text());
              }
            },
            {
              data: null,
              width:'17%',
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

          var dataToProceess = response.data[response.data.result_type]
          , meta =  response.data.meta
          ,contractAddresses = response.data['contract_addresses']
          ;

          dataToProceess.forEach(function(element) {

            var txHash = element.transaction_hash
            ,from = element.t_from
            ,to = element.t_to
            ,txURL = meta.transaction_placeholder_url
            ,addressURL = meta.address_placeholder_url
              , contarct_address = element.contract_address
              ,tokens = element.tokens
              ;

            element['tx_redirect_url'] =  Handlebars.compile(txURL)({
              tr_hash: txHash
            });

            element['from_redirect_url'] =  Handlebars.compile(addressURL)({
              address: from
            });

            element['to_redirect_url'] =  Handlebars.compile(addressURL)({
              address: to
            });

            element['tokens'] = bigNumberToFormat(tokens);
            element['ost_amount'] = bigNumberToFormat(tokens/contractAddresses[contarct_address].price);
            element['company_name'] = contractAddresses[contarct_address].company_name;
            element['company_symbol'] = contractAddresses[contarct_address].company_symbol;

          });
        }
      });

      oThis.topTokens = new TokenTable({
        ajaxURL: oThis.config.top_tokens_url,
        selector: '#homeTopTokens',
        dtConfig: {
          columns: [
            {
              title:'',
              data: null,
              width:'8%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-tokens-col-1').text())({
                  rank: data.rank
                });
              }
            },
            {
              title:'Token',
              data: null,
              width:'23%',
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
              width:'23%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-tokens-col-3').text())({
                  market_cap: bigNumberToFormat(data.market_cap),
                });
              }
            },
            {
              title:'Price (OST α)',
              data: null,
              width:'23%',
              render: function (data, type, full, meta) {
                return Handlebars.compile_fe($('#dt-tokens-col-4').text())({
                  price: bigNumberToFormat(data.price),
                });
              }
            },
            //{
            //  title:'Circulating Supply (bt)',
            //  data: null,
            //  render: function (data, type, full, meta) {
            //
            //    return Handlebars.compile_fe($('#dt-tokens-col-5').text())({
            //      circulating_supply: bigNumberToFormat(data.circulation),
            //    });
            //  }
            //},
          ],
          ordering: false
        },

        responseReceived: function ( response ) {

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
    },

    printTransfersChart: function(interval){
      var url = oThis.config.token_transfer_graph_url+interval;
      switch(interval) {
        case 'Day':
          var format = "h aa";
          var count = 12;
          break;
        case 'Hour':
          var format = 'm';
          var count = 12;
          break;
        case 'Week':
          var format = 'EEE';
          var count = 7;
          break;
        case 'Month':
          var format = 'd';
          var count = 15;
          break;
        case 'Year':
          var format = "MMM''yy";
          var count = 12;
          break;
        case 'All':
          var format = "MMM''yy";
          var count = 12;
          break;
      }
      oThis.googleCharts_1.draw({
        ajax: {
          url: url
        },
        columns: [
          {
            type: 'datetime',
            opt_label: 'Date',
            opt_id: 'timestamp'
          },
          {
            type: 'number',
            opt_label: 'Transaction Count',
            opt_id: 'transaction_count'
          }
        ],
        options: {
          series: {
            0: {
              targetAxisIndex: 0,
              labelInLegend: 'No. of Transfers',
              color: '84d1d4'
            },
            1: {
              targetAxisIndex: 1,
              labelInLegend: 'Value of Transfers',
              color: 'ff5f5a'
            }
          },
          legend: {
            position: 'none'
          },
          chartArea: {
            width: '90%',
            height: '80%'
          },
          hAxis: {
            format: format,
            gridlines: {
              color: 'transparent',
              count: count
            },
            textStyle: oThis.chartTextStyle
          },
          vAxis: {
            gridlines: {
              color: 'e3eef3'
            },
            textStyle: oThis.chartTextStyle
          }
        },
        selector: '#transactionsValue',
        type: 'LineChart'
      });
    },

    chartTextStyle: {
      color: '597a84',
      fontSize: 10
    },

    printVolumeChart: function(interval){
      var url = oThis.config.token_volume_graph_url+interval;
      switch(interval) {
        case 'Day':
          var format = "h aa";
          var count = 12;
          break;
        case 'Hour':
          var format = 'm';
          var count = 12;
          break;
        case 'Week':
          var format = 'EEE';
          var count = 7;
          break;
        case 'Month':
          var format = 'd';
          var count = 15;
          break;
        case 'Year':
          var format = "MMM''yy";
          var count = 12;
          break;
        case 'All':
          var format = "MMM''yy";
          var count = 12;
          break;
      }
      oThis.googleCharts_2.draw({
        ajax: {
          url: url
        },
        columns: [
          {
            type: 'datetime',
            opt_label: 'Date',
            opt_id: 'timestamp'
          },
          {
            type: 'number',
            opt_label: 'Transaction Volume',
            opt_id: 'ost_amount'
          }
        ],
        options: {
          series: {
            0: {
              targetAxisIndex: 0,
              labelInLegend: 'No. of Transfers',
              color: '84d1d4'
            },
            1: {
              targetAxisIndex: 1,
              labelInLegend: 'Value of Transfers',
              color: 'ff5f5a'
            }
          },
          legend: {
            position: 'none'
          },
          chartArea: {
            width: '90%',
            height: '80%'
          },
          hAxis: {
            format: format,
            gridlines: {
              color: 'transparent',
              count: count
            },
            textStyle: oThis.chartTextStyle
          },
          vAxis: {
            gridlines: {
              color: 'e3eef3'
            },
            textStyle: oThis.chartTextStyle
          }
        },
        selector: '#transactionsVolume',
        type: 'LineChart'
      });
    }

  }
})(window, jQuery);