#!/usr/bin/env node
"use strict";

var CronJob = require('cron').CronJob
    , rootPrefix = ".."
    , cliHandler = require('commander')
    , version = require(rootPrefix + '/package.json').version
    , logger = require(rootPrefix + "/helpers/custom_console_logger")
;
var fs = require('fs');

const { spawn } = require('child_process');

var chainId = 2000;

process.chdir(process.env.OST_VIEW_PATH);


cliHandler
  .version(version)
  .usage('Please Specify chain ID \n$>node cron.js -c <chainID> -j <jobID>')
  .option('-c, --chainID <n>', 'Id of the chain', parseInt)
  .option('-j, --jobID <n>', 'Possible jobIDs: "fetcher", "verifier", "aggregator"')
  .parse(process.argv);

if (!cliHandler.chainID) {
  logger.error('\n\tPlease Specify chain ID \n\t$>node cron.js -c <chainID> -j <jobID>\n');
  process.exit(1);
} else {
    chainId = cliHandler.chainID;
    console.log("Passed Chain Id", chainId);
}

 var job1 = new CronJob('*/1 * * * *', function() {
     startBlockFetcher()
 }, null, false, 'Asia/Kolkata');

 var job2 = new CronJob('*/1 * * * *', function() {
     startBlockVerifier()
 }, null, false, 'Asia/Kolkata');

 var job3 = new CronJob('*/1 * * * *', function() {
     startAggregator()
 }, null, false, 'Asia/Kolkata');


startBlockFetcher();
startBlockVerifier();
startAggregator();

job1.start();
job2.start();
job3.start();


// var jobID = String( cliHandler.jobID ).toLowerCase()
//     , job
// ;
//
// switch ( jobID ) {
//     case "fetcher":
//         job = new CronJob('*/1 * * * *', function() {
//             startBlockFetcher(-1, Number.MAX_SAFE_INTEGER);
//         }, null, false, 'Asia/Kolkata');
//         break;
//     case "verifier":
//         job = new CronJob('*/1 * * * *', function() {
//             startBlockVerifier()
//         }, null, false, 'Asia/Kolkata');
//         break;
//     case "aggregator":
//         job = new CronJob('*/1 * * * *', function() {
//             startAggregator()
//         }, null, false, 'Asia/Kolkata');
//         break;
//
//     default:
//         logger.error('\n\tInvalid jobID \n\t$>node cron.js -c <chainID> -j <jobID>\n' + 'Possible jobIDs: "fetcher", "verifier", "aggregator"');
//         process.exit(1);
//         break;
// }
//
// job.start();



function startBlockFetcher() {

    console.log("BlockFetcher initiated");

    const blockFetcher = spawn('./executables/block_fetcher_cron.js', ['-c', chainId]);

    blockFetcher.stdout.on('data', function(data) {
        writeLogsToFile("blockFetcher_process_logs.txt", data);
    });

    blockFetcher.stderr.on('data', function(data) {
        writeLogsToFile("blockFetcher_error_logs.txt", data);
    });

    blockFetcher.on('close', function(code) {
        console.log("blockFetcher child process exited with code", code);
    });
}

function startBlockVerifier() {

    console.log("BlockVerifier initiated");

    const blockFetcher = spawn('./executables/block_verifier_cron.js', ['-c', chainId]);

    blockFetcher.stdout.on('data', function(data) {
        writeLogsToFile("blockVerifier_process_logs.txt", data);
    });

    blockFetcher.stderr.on('data', function(data) {
        writeLogsToFile("blockVerifier_error_logs.txt", data);
    });

    blockFetcher.on('close', function(code) {
        console.log("blockVerifier child process exited with code", code);
    });
}

function startAggregator() {

    console.log("Aggregator initiated");

    const blockFetcher = spawn('./executables/aggregator_cron.js', ['-c', chainId]);

    blockFetcher.stdout.on('data', function(data) {
        writeLogsToFile("aggregator_process_logs.txt", data);
    });

    blockFetcher.stderr.on('data', function(data) {
        writeLogsToFile("aggregatorCron_error_logs.txt", data);
    });

    blockFetcher.on('close', function(code) {
        console.log("aggregator_cron child process exited with code", code);
    });
}


function writeLogsToFile(fileName, data) {
    const LOGS_DIR = "./log/";
    var stream = fs.createWriteStream(LOGS_DIR + fileName, {flags:'a'});
    stream.write(data + "\n");
    stream.end();
}