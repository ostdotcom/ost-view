/**
 * Created by Aniket on 06/02/18.
 */


$(document).ready(function() {
  var transaction_url = document.getElementById('block_transaction_url').innerHTML;
  var transaction_table = document.getElementById('transaction_table');

  $.ajax({
    url: transaction_url,
    contentType: 'application',
    type: 'GET',
    success: function (data, status) {
      console.log("success",data);
      transaction_table.innerHTML = data;
    },
    error: function (XMLHttpRequest, textStatus, errorThrown) {
      console.log("Error Data: " + XMLHttpRequest + "\nStatus: " + textStatus)
    }
  });
});