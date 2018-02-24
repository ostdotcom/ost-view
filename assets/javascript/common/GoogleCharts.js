;(function (window, $) {

  var GoogleCharts = function ( config ) {
    var oThis = this;
    $.extend( oThis, config );
    oThis.load();

  };

  GoogleCharts.prototype = {

    constructor: GoogleCharts,
    version: 'current',
    packages: ['corechart'],
    data: null,
    columns: null,
    ajax: null,
    options: null,
    selector: null,
    type: null,
    tsUnixToJs: true,

    /*
     * Initiates Google Charts by google.charts.load
     */
    load: function(){
      var oThis = this;
      if (typeof google != "undefined" && typeof google.charts != "undefined") {
        google.charts.load(oThis.version, {packages: oThis.packages});
        console.log('Google charts loaded and ready to draw...');
      } else {
        console.warn('Google charts not loaded. Include https://www.gstatic.com/charts/loader.js');
      }
    },

    /*
     * Draw method to be called externally
     * Can pass config here
     */
    draw: function(config){
      var oThis = this;
      $.extend( oThis, config );

      if ( ($.isEmptyObject(oThis.data) && $.isEmptyObject(oThis.ajax)) || !oThis.selector || !oThis.type ){
        console.warn('Mandatory inputs for Google charts are missing [data OR ajax, options, selector, type]');
        return false;
      }

      if(!$.isEmptyObject(oThis.ajax)){
        var ajaxObj = {
          success: function(response){
            oThis.data = oThis.ajaxCallback(response);
            console.log(oThis.data);
            console.log('Drawing chart using AJAX data and callback...');
            oThis.render();
          }
        };
        $.extend( ajaxObj, oThis.ajax );
        $.ajax(ajaxObj);
      } else {
        console.log('Drawing chart using using data...');
        oThis.render();
      }

    },

    /*
     * Make data using columns or only data
     */
    makeData: function(rawData){
      var oThis = this;

      if(!$.isEmptyObject(oThis.columns)){
        var data = new google.visualization.DataTable();
        $.each( oThis.columns, function( index, value ) {
          data.addColumn(value);
        });
        data.addRows(oThis.data);
        console.log('Using custom columns and data to build DataTable...');
      } else {
        var data = google.visualization.arrayToDataTable(rawData);
        console.log('Using data via arrayToDataTable...');
      }

      return data;
    },

    /*
     * Rendering chart
     */
    render: function(){
      var oThis = this;
      google.charts.setOnLoadCallback(function(){
        var data = oThis.makeData(oThis.data);
        var chart = new google.visualization[oThis.type]($(oThis.selector)[0]);
        console.log('Drawing '+oThis.type+' chart in '+oThis.selector);
        chart.draw(data, oThis.options);
      });
    },

    /*
     * dataSrc to specify custom
     */
    dataSrc: function(response){
      return response.data[response.data.result_type];
    },

    /*
     * ajaxCallback boilerplate
     */
    ajaxCallback: function(response){
      var oThis = this;
      var data = [];
      var header = Object.keys(oThis.dataSrc(response)[0]);
      data.push(header);
      $.each( oThis.dataSrc(response), function( index, value ) {
        var row = [];
        header.forEach(function(elem){
          if(oThis.tsUnixToJs === true && typeof value[elem] === 'number' && value[elem] > 1262304000 && (new Date(value[elem])).getYear() < 1971){
            row.push(new Date(value[elem]*1000));
          } else {
            row.push(value[elem]);
          }
        });
        data.push(row);
      });
      return data;
    }

  };

  window.GoogleCharts = GoogleCharts;

})(window, jQuery);