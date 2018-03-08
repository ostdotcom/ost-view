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
        if($("input[type=search]").val().trim() != ''){
          $.ajax({
            url: $(this).attr('action'),
            data: $(this).serialize(),
            success: function(response){
              window.location = response.data[response.data.result_type];
            }
          });
        }
      });

      $('.search-icon').on('click', function(){
        $('#btxSearch').trigger('submit');
      });
    },

  };

  btx.search.init();

})(window, jQuery);