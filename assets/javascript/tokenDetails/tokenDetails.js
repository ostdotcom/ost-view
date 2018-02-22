/**
 * Created by Aniket on 06/02/18.
 */

$(document).ready(function() {
  var transaction_url = document.getElementById("transactionUrl").innerHTML;

  $("#test").on("click", function () {
    console.log("test clicked! click");
  });

  var something;

  var dtConfig = {
    "bLengthChange": false,
    "searching": false,
    "processing": true,
    "serverSide": true,
    "autoWidth": false,
    "ajax": {
      "url": transaction_url,
      "dataSrc": function (json) {
        return json.data.contract_internal_transactions;
      }
    },
    "columns": []
  };

  var handlebarsCompile = function(string){
    return Handlebars.compile(string.replace(/\[\[/g, '{{').replace(/\]\]/g, '}}'));
  };

  var dt_col_1 = handlebarsCompile($('#dt-col-1').text());
  var dt_col_2 = handlebarsCompile($('#dt-col-2').text());
  var dt_col_3 = handlebarsCompile($('#dt-col-3').text());
  var dt_col_4 = handlebarsCompile($('#dt-col-4').text());
  var dt_col_5 = handlebarsCompile($('#dt-col-5').text());
  var dt_col_6 = handlebarsCompile($('#dt-col-6').text());
  var dt_col_7 = handlebarsCompile($('#dt-col-7').text());

   dtConfig.columns.unshift(
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return dt_col_1({
          symbol: 'AKC',
          name: 'Akshay Coin'
        });
      }
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class="text-truncate d-inline-block tokenDetailsMaxWidth"><img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /> <span class="">'+ data.tokens +'</span></div>';
      }
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class="text-truncate d-inline-block tableBorderRight"> <img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /><span class="">'+ moment(data.timestamp * 1000).startOf('day').fromNow()  +'</span> </div>';
      }
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class=" text-truncate d-inline-block tokenDetailsMaxWidth"><span class="tokenDetailsColora84"> TX#</span><span class="default_bright_blue">'+data.transaction_hash +'</span></div>';
      }
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class=" text-truncate d-inline-block tokenDetailsMaxWidth"><span class="tokenDetailsColora84"> From </span><span class="default_bright_blue">'+ data.t_from+' </span></div>';
      }
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" />';
      }
    },
    {
      title: '',
      data: null,
      render: function(data, type, full, meta){
        return '<div class=" text-truncate d-inline-block tokenDetailsMaxWidth"><span class="tokenDetailsColora84"> To </span><span class="default_bright_blue">'+ data.t_to +' </span></div>';
      }
    }
  );


  $('#tokenDetailsRecentTrans').DataTable(dtConfig);

});




///For token holders

//dtConfig.columns.unshift(
//  {
//    title: '',
//    data: null,
//    render: function (data, type, full, meta) {
//      return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /> <span class="default_bright_blue "> &nbsp' + data.t_from + '</span>';
//    },
//    width: '30%'
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<span class="tokenDetailsColora84"> Available Balance </span>';
//    },
//    width: '10%'
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon"/>&nbsp<span class="tokenDetailsCoinAmount">' + data.tokens + ' FRC </span>';
//    },
//    width: '20%'
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<span class="tokenDetailsColora84">(' + 100 + ' OST α)</span> ';
//    },
//    width: '40%'
//  }
//);


///For Token Transfer
//dtConfig.columns.unshift(
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /><span class="tokenDetailsColora84 ">'+data.id+'</span>';
//    },
//    width: '20%',
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /> <span class="">'+ data.tokens +'</span>';
//    },
//    width: '16%'
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<div class="tableBorderRight"> <img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" /><span class="">'+ data.timestamp +'</span> </div>';
//    },
//    width: '16%'
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return ' <span class="tokenDetailsColora84"> TX#</span><span class="default_bright_blue">'+data.hash.substr( 0, 15 )+'... </span>';
//    },
//    width: '16%',
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<span class="tokenDetailsColora84"> From </span><span class="default_bright_blue">'+ data.t_from.substr( 0, 15 )+'... </span>';
//    },
//    width: '16%',
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<img src="https://dummyimage.com/400x400/22aaee/fff.png" class="tokenIcon" />';
//    },
//    width: '4%',
//  },
//  {
//    title: '',
//    data: null,
//    render: function(data, type, full, meta){
//      return '<span class="tokenDetailsColora84"> To </span><span class="default_bright_blue">'+ data.t_to.substr( 0, 15 )+'... </span>';
//    },
//    width: '16%',
//  }
//);

