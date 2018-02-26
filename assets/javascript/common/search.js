;(function ( window, $){

  var btx  = ns("btx");

  var oThis = btx.search = {

    config: {},
    init: function ( config ) {
      var oThis = this;
      $.extend(oThis.config, config);
      oThis.bindButtons();
    },

    bindButtons: function(){
      $('#btxSearch').on('submit', function(e){
        e.preventDefault();
        $.ajax({
          url: $(this).attr('action'),
          data: $(this).serialize(),
          success: function(response){
            window.location = response.data[response.data.result_type];
          }
        });
      });
    },

  };

  btx.search.init();

})(window, jQuery);