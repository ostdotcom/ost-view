;(function ( window, $){

  var btx  = ns("btx");

  var oThis = btx.tokenDetails = {

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
      var recentTransTable = new TokenTable({
        ajaxURL: oThis.config.transactions_url,
        selector: '#tokenDetailsRecentTrans',
        dtConfig : {
          columns: [
            {
              data: null,
              width:'16%',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-col-1').text())({
                  symbol: data.company_symbol,
                  name: data.company_name
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
                  value: data.ost_amount
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
          var dataToProceess = response.data[response.data.result_type];
          var meta =  response.data.meta
          ,contractAddresses = response.data['contract_address']
          ;

          dataToProceess.forEach(function(element) {
            var txHash = element.transaction_hash;
            var from = element.t_from;
            var to = element.t_to
              , contarct_address = element.contract_address
              , tokens = element.tokens
              , price = contractAddresses[contarct_address].price
            ;

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

            element['tokens'] = bigNumberFormatter(convertToBigNumber(tokens));
            element['ost_amount'] = bigNumberFormatter(convertToBigNumber(tokens).multipliedBy(convertToBigNumber(price)));

            element['company_name'] = contractAddresses[contarct_address].company_name;
            element['company_symbol'] = contractAddresses[contarct_address].company_symbol;
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
              width:'20%',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-holders-col-1').text())({
                  name: data.address,
                  redirect_url: data.address_redirect_url
                });
              }
            },
            {
              data: null,
              width:'35%',
              render: function(data, type, full, meta){
                return Handlebars.compile_fe($('#dt-holders-col-3').text())({
                  tokens: data.tokens,
                  coin_name : data.company_symbol,
                  value: data.ost_amount
                });
              }
            },
            {
              title:'',
              data: null,
              width:'45%',
              render: function (data, type, full, meta) {
                return '';
              }
            }
          ]
        },
        responseReceived: function ( response ) {
          var dataToProceess = response.data[response.data.result_type];
          var meta =  response.data.meta
            ,contractAddresses = response.data['contract_address']
            , contarct_address = meta.q
            ;

          dataToProceess.forEach(function(element) {
            var name = element.address
              ,tokens = element.tokens
              ,price = contractAddresses[contarct_address].price
            ;

            var addressURL = meta.address_placeholder_url;

            element['address_redirect_url'] =  Handlebars.compile(addressURL)({
              address: name
            });

            element['tokens'] = bigNumberFormatter(convertToBigNumber(tokens));
            element['ost_amount'] = bigNumberFormatter(convertToBigNumber(tokens).multipliedBy(convertToBigNumber(price)));

            element['company_name'] = contractAddresses[contarct_address].company_name;
            element['company_symbol'] = contractAddresses[contarct_address].company_symbol;
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
    },

  };

})(window, jQuery);