;(function ( window, $){

  var btx  = ns("btx");

  var oThis = btx.tokenDetails = {

    config: {},
    init: function ( config ) {
      var oThis = this;
      $.extend(oThis.config, config);
      oThis.googleCharts_1 = new GoogleCharts();
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
          // other
        }

      });

    },

    triggerClick: function(){
      $('.interval[data-interval="Hour"]').trigger('click');
    },

    initDatatable: function(){
      var oThis = this;
      var recentTransTable = new TokenTable({
        ajaxURL: oThis.config.transactions_url,
        selector: '#tokenDetailsRecentTrans',
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

      var tokenHolders = new TokenTable({
        ajaxURL: oThis.config.token_holders_url,
        selector: '#tokenDetailsTokenHolders',
        dtConfig : {
          columns: [
            {
              data: null,
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-holders-col-1').text())({
                  name: data.address
                });
              }
            },
            {
              data: null,
              render: function(data, type, full, meta){
                return $('#dt-holders-col-2').text();
              }
            },
            {
              data: null,
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-holders-col-3').text())({
                  tokens: data.tokens,
                  value: 100
                });
              }
            }
          ]
        }

      });
    },

    printTransfersChart: function(interval){
      var url = oThis.config.token_transfer_graph_url+interval;
      switch(interval) {
        case 'Day':
          var format = 'H';
          var count = 24;
          break;
        case 'Hour':
          var format = 'm';
          var count = 12;
          break;
        case 'Week':
          var format = 'EE';
          var count = 7;
          break;
        case 'Month':
          var format = 'd';
          var count = 30;
          break;
        case 'Year':
          var format = 'MMM';
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
    }
  };

})(window, jQuery);