#!/usr/bin/env node
"use strict";

var CronJob = require('cron').CronJob;
var fs = require('fs');

const { spawn } = require('child_process');

var chainId = 2000;

process.chdir(process.env.OST_VIEW_PATH);

if (process.argv[2] == '-c' && process.argv[3] != undefined){
    chainId = parseInt(process.argv[3]);
    console.log("Passed Chain Id", chainId);
}

// var job1 = new CronJob('*/1 * * * *', function() {
//     startBlockFetcher()
// }, null, false, 'Asia/Kolkata');
//
// var job2 = new CronJob('*/1 * * * *', function() {
//     startBlockVerifier()
// }, null, false, 'Asia/Kolkata');
//
// var job3 = new CronJob('*/1 * * * *', function() {
//     startAggregator()
// }, null, false, 'Asia/Kolkata');

// startBlockFetcher(65750, 65760);
startBlockFetcher(66290,662900);
// startBlockFetcher(65770,65780);

// startBlockFetcher(65739, 70000);
// startBlockFetcher(70000,75000);
// startBlockFetcher(75000,100000000);
//startBlockVerifier();
//startAggregator();

// job1.start();
//job2.start();
//job3.start();

function startBlockFetcher(firstBN, lastBN) {

    console.log("BlockFetcher initiated");

    const blockFetcher = spawn('./executables/block_fetcher_cron.js', ['-c', chainId, '-f', firstBN, '-l', lastBN]);

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
    const LOGS_DIR = "./log/";
    var stream = fs.createWriteStream(LOGS_DIR + fileName, {flags:'a'});
    stream.write(data + "\n");
    stream.end();
}