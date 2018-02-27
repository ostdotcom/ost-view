#!/usr/bin/env node
"use strict";

var CronJob = require('cron').CronJob;
var fs = require('fs');

const { spawn } = require('child_process');

var chainId = 2000;

if (process.argv[2] == '-c' && process.argv[3] != undefined){
    chainId = parseInt(process.argv[3]);
    console.log("Passed Chain Id", chainId);
}

var job1 = new CronJob('*/5 * * * *', function() {
    startBlockFetcher()
}, null, false, 'Asia/Kolkata');

var job2 = new CronJob('*/5 * * * *', function() {
    startBlockVerifier()
}, null, false, 'Asia/Kolkata');

var job3 = new CronJob('*/5 * * * *', function() {
    startAggregator()
}, null, false, 'Asia/Kolkata');


job1.start();
job2.start();
job3.start();

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

    const blockFetcher = spawn('./executables/aggregatorCron.js', ['-c', chainId]);

    blockFetcher.stdout.on('data', function(data) {
        writeLogsToFile("aggregator_process_logs.txt", data);
    });

    blockFetcher.stderr.on('data', function(data) {
        writeLogsToFile("aggregatorCron_error_logs.txt", data);
    });

    blockFetcher.on('close', function(code) {
        console.log("aggregatorCron child process exited with code", code);
    });
}


function writeLogsToFile(fileName, data) {
    const LOGS_DIR = "./logs/";
    var stream = fs.createWriteStream(LOGS_DIR + fileName, {flags:'a'});
    stream.write(data + "\n");
    stream.end();
}