/**
 * Created by Aniket on 06/02/18.
 */


$(document).ready(function() {
  var transaction_url = document.getElementById("transactionUrl").innerHTML;

  $("#test").on("click", function () {
    console.log("test clicked! click");
  });

  var dtConfig = {
    "bLengthChange": false,
    "searching": false,
    "processing": true,
    "serverSide": true,
    "ajax": {
      "url": transaction_url,
      "dataSrc": function (json) {
        return json.data.contract_internal_transactions;
      }
    },
    "columns": []
  };

  dtConfig.columns.unshift(
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /><span class="tokenDetailsColora84 ">'+data.id+'</span>';
      },
      width: '20%',
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /> <span class="">'+ data.tokens +'</span>';
      },
      width: '16%'
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class="tableBorderRight"> <img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /><span class="">'+ data.timestamp +'</span> </div>';
      },
      width: '16%'
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return ' <span class="tokenDetailsColora84"> TX#</span><span class="default_bright_blue">'+data.hash.substr( 0, 15 )+'... </span>';
      },
      width: '16%',
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<span class="tokenDetailsColora84"> From </span><span class="default_bright_blue">'+ data.t_from.substr( 0, 15 )+'... </span>';
      },
      width: '16%',
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" />';
      },
      width: '4%',
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<span class="tokenDetailsColora84"> To </span><span class="default_bright_blue">'+ data.t_to.substr( 0, 15 )+'... </span>';
      },
      width: '16%',
    }
  );

  $('#tokenDetailsRecentTrans').DataTable(dtConfig);

});

