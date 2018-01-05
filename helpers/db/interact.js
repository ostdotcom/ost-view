const mysql = require('./mysql.js');

const dbhelper = {
	getAccountTransactions: async function(accountAddress) {
		var docClient = dbhandle.getDocClient();
		//Step 1: First get all the transactions hash set from the transaction ledger
		var params = {
  				ExpressionAttributeValues: {
    				':addhash': accountAddress
   				},
 				KeyConditionExpression: 'address = :addhash',
 				TableName: 'TransactionLedger_Staging'
			};

			docClient.query(params, function(err, data) {
  					if (err) {
    					console.log("Error", err);
  					} else {
    					console.log("Success", data.Items);
  					}
		});
		//Step 2: Query all the transactions from transaction hash set
	}
};


module.exports = dbhelper;