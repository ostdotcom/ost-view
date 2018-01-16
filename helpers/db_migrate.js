"use strict";

var core_config = require("../config.js");
// first require the package
var DBMigrate = require( 'db-migrate' );
var fs 		  = require('fs');

var chainId = '141';
var param = process.argv[2];

if (param != undefined) {
	chainId = param.toString();
	console.log(chainId);
}

var db_config = core_config.getChainDbConfig(chainId);

var json = {};
json['stage'] = db_config;
json['dev'] = db_config;


json = JSON.stringify(json);
try {
	fs.writeFileSync('database.json', json, 'utf8');
}

catch(error) {
	throw error;
	process.exit(1);
}

// The next step is to get a new instance of DBMigrate
var dbmigrate = DBMigrate.getInstance(true);

// next we call the migrations
console.log(db_config.database);

dbmigrate.reset(() => {
  dbmigrate.up(() => {
     console.log('Migration Successful');
  } );
});