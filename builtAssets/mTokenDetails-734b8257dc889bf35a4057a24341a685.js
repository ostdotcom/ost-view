$(document).ready(function(){var t=document.getElementById("transactionUrl").innerHTML;document.getElementById("transactionTable");$("#test").on("click",function(){console.log("test clicked!")}),$("#tokenDetailsRecentTrans").DataTable({bLengthChange:!1,searching:!1,processing:!0,serverSide:!0,ajax:{url:t,success:function(t){return{data:t.data.contract_internal_transactions,draw:t.data.draw,recordsTotal:t.data.recordsTotal}}},columns:[{data:"id"},{data:"hash"},{data:"t_from"},{data:"t_to"},{data:"tokens"},{data:"timestamp"}]})});