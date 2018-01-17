#!/usr/bin/env node
"use strict";

const cliHandler  = require('commander')
	, fs 		  = require('fs')
	, DBMigrate   = require( 'db-migrate' )
	, core_config = require("../config.js")
;

const resetUp = function() {
	initDBConfigFile(this.chainID);

	// The next step is to get a new instance of DBMigrate
	var dbmigrate = DBMigrate.getInstance(true);

	dbmigrate.reset(() => {
	  dbmigrate.up(() => {
	     console.log('ResetUp Migration Successful');
	  } );
	});
}

const reset = function() {
	initDBConfigFile(this.chainID);

	// The next step is to get a new instance of DBMigrate
	var dbmigrate = DBMigrate.getInstance(true);

	dbmigrate.reset(() => {
	     console.log('Reset Migration Successful');
	});
}

const up = function(version) {
	initDBConfigFile(this.chainID);
	console.log("Version migration :", version);

	// The next step is to get a new instance of DBMigrate
	var dbmigrate = DBMigrate.getInstance(true);

	dbmigrate.up(version ,() => {
	     console.log('Up Migration Successful');
	} );
}

const createMigration = function(name) {
	initDBConfigFile(this.chainID);
	console.log("Migration name:", name);

	// The next step is to get a new instance of DBMigrate
	var dbmigrate = DBMigrate.getInstance(true);

	dbmigrate.create(name, null, () => {
	     console.log('Migration created Successfully');
	} );
}

const initDBConfigFile = function(chainID) {
	
	var db_config = core_config.getChainDbConfig(chainID);
	console.log(db_config.database);

	var json = {};
	json['dev'] = db_config;
	
	json = JSON.stringify(json);
	try {
		fs.writeFileSync('database.json', json, 'utf8');
	}

	catch(error) {
		throw error;
		process.exit(1);
	}
} 

//'Please Specify command  \n$>node db_migrate.js --chainID <chain ID > <Command>'
cliHandler
  .version('1.0')
  .command('reset-up')
  .description('To run migration up all version after reset')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .action(resetUp);

cliHandler
  .version('1.0')
  .command('up [version]')
  .description('To run migration up till version specified or else full')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .action(up);

cliHandler
  .version('1.0')
  .command('reset')
  .description('To reset all migrations')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .action(reset);

 cliHandler
  .version('1.0')
  .command('create <migration-name>')
  .description('To create migrations')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .action(createMigration);

cliHandler.parse(process.argv);