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
    data: [],
    columns: [],
    ajax: {},
    options: {},
    selector: null,
    type: null,

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
        }
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
     * ajaxCallback boilerplate
     */
    ajaxCallback: function(response){
      var data = [];
      data.push(Object.keys(response.data[response.data.result_type][0]));
      $.each( response.data[response.data.result_type], function( index, value ) {
        data.push(Object.values(value));
      });
      return data;
    }

  };

  window.GoogleCharts = GoogleCharts;

})(window, jQuery);