#!/usr/bin/env node
"use strict";
/**
 * DB-migrate CLI file to handle migration functionality of the databases
 *
 * @example
 * node executables/db_migrate.js -h
 * @example
 * node executables/db_migrate.js create
 * @example
 * node executables/db_migrate.js up (Add all new migrations to all chain databases)
 * @example
 * node executables/db_migrate.js reset (NOTE: will completely wipe the database)
 * @example
 * node executables/db_migrate.js reset-up (NOTE: will completely wipe the database)
 *
 * @module executables/db_migrate
 */

// Load external libraries
const cliHandler = require('commander')
  , fs = require('fs')
  , DBMigrate = require('db-migrate')
;

// Load internal files
const rootPrefix = '..'
  , config = require(rootPrefix + '/config')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , version = require(rootPrefix + '/package.json').version
;

process.chdir(process.env.OST_VIEW_PATH);

/**
 * To get the chainList of IDs from the object commandline object,
 * If not present return all the chaidIDs from the config.
 *
 * @param  {Object} obj Object of commander
 *
 * @return {Array} chainIDs Array of chainIDs
 */
const getChainList = function (obj) {

  var chainIDs = [];
  if (obj.chainID) {
    chainIDs.push(obj.chainID);
  } else {
    chainIDs = config.getAllChainIDs();
  }

  return chainIDs;
};

/**
 * To create database.json temp file based on chainID provided.
 * It is used by db-migrate to create object of the same
 *
 * @param  {Integer} chainID - Chain Id
 *
 * @return {null}
 */
const initDBConfigFile = function (chainID) {

  var db_config = config.getChainDbConfig(chainID);
  console.log(db_config.database);

  var json = {};
  json.dev = db_config;

  json = JSON.stringify(json);
  try {
    // database.json is a temp file used only for migrations purpose
    fs.writeFileSync('database.json', json, 'utf8');
  }

  catch (error) {
    throw error;
  }
};

/**
 * To run migration up all versions after reset
 *
 * @return {null}
 */
const resetUp = function () {
  var chainIDs = getChainList(this);

  chainIDs.forEach(function (chainID) {

    initDBConfigFile(chainID);

    // The next step is to get a new instance of DBMigrate
    var dbmigrate = DBMigrate.getInstance(true);

    dbmigrate.reset(function (err) {
      if (err) {
        logger.error(err);
        process.exit(1);
      }
      dbmigrate.up(function (err) {
        if (err) {
          logger.error(err);
          process.exit(1);
        }
        logger.log('ResetUp Migration Successful');
        process.exit(1);

      });
    });
  });
};

/**
 * To reset all migrations
 */
const reset = function () {
  var chainIDs = getChainList(this);

  chainIDs.forEach(function (chainID) {

    logger.log('Running reset of chainID', chainID);
    initDBConfigFile(chainID);

    // The next step is to get a new instance of DBMigrate
    var dbmigrate = DBMigrate.getInstance(true);

    dbmigrate.reset(function (err) {
      if (err) {
        logger.error(err);
        process.exit(1);
      }
      logger.log('Reset Migration Successful');
      process.exit(1);

    });
  });
};

/**
 * To runs all pending migrations till provided version or else full version if not provided
 *
 * @param  {String} version Name of the version
 *
 * @return {null}
 */
const up = function (version) {
  var chainIDs = getChainList(this);

  chainIDs.forEach(function (chainID) {

    logger.log('Running reset of chainID', chainID);
    initDBConfigFile(chainID);
    logger.log("Version migration :", version);

    // The next step is to get a new instance of DBMigrate
    var dbmigrate = DBMigrate.getInstance(true);

    dbmigrate.up(version, function (err) {
      if (err) {
        logger.error(err);
        process.exit(1);
      }
      logger.log('Up Migration Successful');
      process.exit(1);

    });
  });
};

/**
 * To create migration with provide migration name
 *
 * @param  {String} name Name of the migration to be created
 *
 * @return {null}
 */
const createMigration = function (name) {

  //Getting chain ID of first config. It is irrelevent in case of mirgration creation.
  if (!config.getAllChainIDs()[0]) {
    logger.error('Config of chain not defined');
    process.exit(0);
  }

  initDBConfigFile(config.getAllChainIDs()[0]);
  logger.log("Migration name:", name);

  // The next step is to get a new instance of DBMigrate
  var dbmigrate = DBMigrate.getInstance(true);

  dbmigrate.create(name, null, function (err) {
    if (err) {
      logger.error(err);
      process.exit(1);
    }
    logger.log('Migration created Successfully');
  });
};

/**
 * Please Specify command  $>node executables/db_migrate.js <Command> --chainID [chain ID]
 */
cliHandler
  .version(version)
  .command('reset-up')
  .description('To run migration up all version after reset')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .action(resetUp);

cliHandler
  .version(version)
  .command('up [version]')
  .description('To run migration up till version specified or else full')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .action(up);

cliHandler
  .version(version)
  .command('reset')
  .description('To reset all migrations')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .action(reset);

cliHandler
  .version(version)
  .command('create <name>')
  .description('To create new migrations')
  .action(createMigration);

cliHandler.parse(process.argv);