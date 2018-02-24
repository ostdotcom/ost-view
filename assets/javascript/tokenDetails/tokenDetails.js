;(function ( window, $){

  var btx  = ns("btx");

  var oThis = btx.tokenDetails = {

    config: {},
    init: function ( config ) {
      var oThis = this;
      $.extend(oThis.config, config);
      oThis.googleCharts_1 = new GoogleCharts();
      oThis.bindButtons();
      oThis.initDatatable();
    },

    bindButtons: function(){

      $('.interval').on('click', function(){
        $('.interval').removeClass('active');
        $(this).addClass('active');
      });

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
                  symbol: 'AKC',
                  name: 'Akshay Coin'
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
        }
      });
      recentTransTable.responseReceived = function ( response ) {
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
      };
    },

    printTransactionsChart: function(interval){
      if(['day','hour','month'].indexOf(interval) == -1) {
        return;
      }
      switch(interval) {
        case 'day':
          var url = 'http://devcompany.com:8080/day.json';
          var count = 24;
          var format = 'H';
          break;
        case 'hour':
          var url = 'http://devcompany.com:8080/hour.json'
          var count = 12;
          var format = 'm';
          break;
        case 'month':
          var url = 'http://devcompany.com:8080/month.json'
          var count = 30;
          var format = 'd';
          break;
      }
      oThis.googleCharts_1.draw({
        ajax: {
          url: url
        },
        ajaxCallback: function(response){
          var data = [];
          data.push(Object.keys(response.data[response.data.result_type][0]));
          $.each( response.data[response.data.result_type], function( index, value ) {
            data.push([new Date(value.timestamp*1000), value.transaction_count, value.ost_amount]);
          });
          return data;
        },
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
            alignment: 'end',
            position: 'top',
            textStyle: oThis.chartTextStyle
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

    printTypeChart: function(){
      oThis.googleCharts_2.draw({
        ajax: {
          url: 'http://devcompany.com:8080/transactionByType.json'
        },
        selector: '#transactionsType',
        type: 'ColumnChart',
        options:{
          series: {
            0: {
              labelInLegend: 'Type of Transfers',
              color: 'f6c62b'
            }
          },
          legend: {
            alignment: 'end',
            position: 'top',
            textStyle: oThis.chartTextStyle
          },
          bars: 'vertical',
          chartArea: {
            width: '90%',
            height: '80%'
          },
          hAxis: {
            textStyle: oThis.chartTextStyle,
            ticks: ['a','b','c']
          },
          vAxis: {
            textStyle: oThis.chartTextStyle
          }
        }
      });
    },

    printSupplyChart: function(){
      oThis.googleCharts_3.draw({
        data: [
          ['Category', 'Value'],
          [$('[data-ost_available_key]').text(),    parseInt($('[data-ost_available_val]').text())],
          [$('[data-ost_allocated_key]').text(),    parseInt($('[data-ost_allocated_val]').text())],
          [$('[data-ost_staked_key]').text(),       parseInt($('[data-ost_staked_val]').text())]
        ],
        selector: '#ostSupplyPie',
        type: 'PieChart',
        options: {
          pieHole: 0.7,
          pieSliceText: 'none',
          pieSliceBorderColor: 'none',
          colors: ['f6c62b','88c7ca','34445b'],
          backgroundColor: 'transparent',
          legend: 'none',
          chartArea: {
            width: 180,
            height: 180,
            top: 10,
            left: 10
          }
        }
      })
    },

    chartTextStyle: {
      color: '597a84',
      fontSize: 10
    }
  };

})(window, jQuery);