#!/usr/bin/env node
"use strict";

/**
  * DB-migrate CLI file to handle migration functionality of the databases
  */

const cliHandler  = require('commander')
	, fs 		  = require('fs')
	, DBMigrate   = require( 'db-migrate' )

	, rootPrefix  = '..'
	, core_config = require(rootPrefix + '/config')
	, logger      = require(rootPrefix + '/helpers/CustomConsoleLogger')
;

/**
  * To get the chainList of IDs from the object commandline object,
  * If not present return all the chaidIDs from the config.
  */
const getChainList = function(obj) {
	
	var chainIDs = [];
	if ( obj.chainID ) {
		chainIDs.push(obj.chainID);
	} else {
		chainIDs = core_config.getAllChainIDs();
	}

	return chainIDs;
};

/**
  *	To create database.json temp file based on chainID provided.
  * It is used by db-migrate to create object of the same
  */
const initDBConfigFile = function(chainID) {
	
	var db_config = core_config.getChainDbConfig(chainID);
	console.log(db_config.database);

	var json = {};
	json.dev = db_config;
	
	json = JSON.stringify(json);
	try {
		// database.json is a temp file used only for migrations purpose
		fs.writeFileSync('database.json', json, 'utf8');
	}

	catch(error) {
		throw error;
	}
}; 

/**
  * To run migration up all versions after reset
  */
const resetUp = function() {
	var chainIDs = getChainList(this);
	
	chainIDs.forEach((chainID) => {

		initDBConfigFile(chainID);

		// The next step is to get a new instance of DBMigrate
		var dbmigrate = DBMigrate.getInstance(true);

		dbmigrate.reset((err) => {
			if(err) {
				logger.error(err);
				process.exit(1);
			}
		  dbmigrate.up((err) => {
		  	if(err) {
				logger.error(err);
				process.exit(1);
			}
		    logger.log('ResetUp Migration Successful');
		  } );
		});
	});
};

/**
  * 'To reset all migrations
  */
const reset = function() {
	var chainIDs = getChainList(this);
	
	chainIDs.forEach((chainID) => {
		
		logger.log('Running reset of chainID', chainID);
		initDBConfigFile(chainID);

		// The next step is to get a new instance of DBMigrate
		var dbmigrate = DBMigrate.getInstance(true);

		dbmigrate.reset((err) => {
			 if(err) {
				logger.error(err);
				process.exit(1);
			}
		    logger.log('Reset Migration Successful');
		});
	});
};

/**
  *	To runs all pending migrations till provided version or else full version if not provided
  */
const up = function(version) {
	var chainIDs = getChainList(this);
	
	chainIDs.forEach((chainID) => {

		logger.log('Running reset of chainID', chainID);
		initDBConfigFile(chainID);
		logger.log("Version migration :", version);

		// The next step is to get a new instance of DBMigrate
		var dbmigrate = DBMigrate.getInstance(true);

		dbmigrate.up(version ,(err) => {
			if(err) {
				logger.error(err);
				process.exit(1);
			}
		    logger.log('Up Migration Successful');
		});
	});
};

/**
  * To create migration with provide migration name
  */
const createMigration = function(name) {
	
	//Getting chain ID of first config. It is irrelevent in case of mirgration creation.
	if ( !core_config.getAllChainIDs()[0] ) {
		logger.error('Config of chain not defined');
		process.exit(0);
	}

	initDBConfigFile( core_config.getAllChainIDs()[0] );
	logger.log("Migration name:", name);

	// The next step is to get a new instance of DBMigrate
	var dbmigrate = DBMigrate.getInstance(true);

	dbmigrate.create(name, null, (err) => {
		if(err) {
			logger.error(err);
			process.exit(1);
		}
	    logger.log('Migration created Successfully');
	});
};

//'Please Specify command  $>node db_migrate.js <Command> --chainID [chain ID]'
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
  .action(createMigration);

cliHandler.parse(process.argv);