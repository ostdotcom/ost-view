/**
 * Created by Aniket on 08/02/18.
 */
$(document).ready(function() {
  var transaction_url = document.getElementById("transactionUrl").innerHTML;

  var dtConfig = {
    "bLengthChange": false,
    "searching": false,
    "processing": true,
    "serverSide": true,
    "ajax": {
      "url": transaction_url,
      "dataSrc": function (json) {
        return json.data.transactions;
      }
    },
    "columns": []
  };

  dtConfig.columns.unshift(
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class="text-truncate d-inline-block addressCellMaxWidth"><img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /><span class="tokenDetailsColora84 ">'+data.id+'</span></div>';
      },
      width: '20%',
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class="text-truncate d-inline-block addressCellMaxWidth"><img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /> <span class="">'+ data.tokens +'</span></div>';
      },
      width: '16%'
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class="text-truncate d-inline-block tableBorderRight"> <img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /><span class="">'+ moment(data.timestamp * 1000).startOf('day').fromNow()  +'</span> </div>';
      },
      width: '16%'
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class=" text-truncate d-inline-block addressCellMaxWidth"><span class="tokenDetailsColora84"> TX#</span><span class="default_bright_blue">'+data.transaction_hash +'</span></div>';
      },
      width: '16%',
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class=" text-truncate d-inline-block addressCellMaxWidth"><span class="tokenDetailsColora84"> From </span><span class="default_bright_blue">'+ data.address+' </span></div>';
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
        return '<div class=" text-truncate d-inline-block addressCellMaxWidth"><span class="tokenDetailsColora84"> To </span><span class="default_bright_blue">'+ data.corresponding_address +' </span></div>';
      },
      width: '16%',
    }
  );


  $('#transactions').DataTable(dtConfig);

});