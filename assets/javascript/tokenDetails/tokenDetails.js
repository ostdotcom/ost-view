/**
 * Created by Aniket on 06/02/18.
 */

$(document).ready(function() {
  var transaction_url = document.getElementById("transactionUrl").innerHTML;

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

  var dt_cols = [
    handlebarsCompile($('#dt-col-1').text()),
    handlebarsCompile($('#dt-col-2').text()),
    handlebarsCompile($('#dt-col-3').text()),
    handlebarsCompile($('#dt-col-4').text()),
    handlebarsCompile($('#dt-col-5').text()),
    handlebarsCompile($('#dt-col-6').text()),
    handlebarsCompile($('#dt-col-7').text())
  ];
   dtConfig.columns.unshift(
    {
      data: null,
      render: function(data, type, full, meta){
        return dt_cols[0]({
          symbol: 'AKC',
          name: 'Akshay Coin'
        });
      }
    },
    {
      data: null,
      render: function(data, type, full, meta){
        return dt_cols[1]({
          tokens: data.tokens,
          value: 100
        });
      }
    },
    {
      data: null,
      render: function(data, type, full, meta){
        return dt_cols[2]({
          timestamp: moment(data.timestamp * 1000).startOf('day').fromNow()
        });
      }
    },
    {
      data: null,
      render: function(data, type, full, meta){
        return dt_cols[3]({
          tx: data.transaction_hash
        });
      }
    },
    {
      data: null,
      render: function(data, type, full, meta){
        return dt_cols[4]({
          from: data.t_from
        });
      }
    },
    {
      data: null,
      render: function(data, type, full, meta){
        return dt_cols[5]();
      }
    },
    {
      data: null,
      render: function(data, type, full, meta){
        return dt_cols[6]({
          to: data.t_to
        });
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

