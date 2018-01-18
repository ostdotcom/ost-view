
"use strict";

/*
 * Main application file
 *
 */

//All Module Requires.
const express = require('express')
  , path = require('path')
  , favicon = require('serve-favicon')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , basicAuth = require('express-basic-auth')
  , helmet = require('helmet')
  , sanitizer = require('express-sanitized')
  , http = require('http')
  , cluster = require('cluster')
  // , createNamespace = require('continuation-local-storage').createNamespace
  // , inputRequest = createNamespace('inputRequest')

;

//All the requires.
const rootPrefix    = "."
  , indexRoutes     = require( rootPrefix + '/routes/index')
  , blockRoutes     = require( rootPrefix + '/routes/block')
  , blocksRoutes     = require( rootPrefix + '/routes/blocks')
  , transactionsRoutes     = require( rootPrefix + '/routes/transactions')
  , transactionRoutes     = require( rootPrefix + '/routes/transaction')
  , addressRoutes   = require( rootPrefix + '/routes/address')
  , searchRoutes   = require( rootPrefix + '/routes/search')
  , contractRoutes = require(rootPrefix + '/routes/contract')
  , logger = require('./helpers/CustomConsoleLogger')
;

// if the process is a master.
if (cluster.isMaster) {
  // Set worker process title
  process.title = "OpenST-Platform node master";

  // Fork workers equal to number of CPUs
  const numWorkers = process.env.WORKERS || require('os').cpus().length;

  for (var i = 0; i < numWorkers; i++) {
    // Spawn a new worker process.
    cluster.fork();
  }

  // Worker started listening and is ready
  cluster.on('listening', function(worker, address) {
    logger.info(`[worker-${worker.id} ] is listening to ${address.address}:${address.port}`);
  });

  // Worker came online. Will start listening shortly
  cluster.on('online', function(worker) {
    logger.info(`[worker-${worker.id}] is online`);
  });

  //  Called when all workers are disconnected and handles are closed.
  cluster.on('disconnect', function(worker) {
    logger.error(`[worker-${worker.id}] is disconnected`);
  });

  // When any of the workers die the cluster module will emit the 'exit' event.
  cluster.on('exit', function(worker, code, signal) {
    if (worker.exitedAfterDisconnect === true) {
      // don't restart worker as voluntary exit
      logger.info(`[worker-${worker.id}] voluntary exit. signal: ${signal}. code: ${code}`);
    } else {
      // restart worker as died unexpectedly
      logger.error(`[worker-${worker.id}] restarting died. signal: ${signal}. code: ${code}`, worker.id, signal, code);
      cluster.fork();
    }
  });

  // When someone try to kill the master process
  // kill <master process id>
  process.on('SIGTERM', function() {
    for (var id in cluster.workers) {
      cluster.workers[id].exitedAfterDisconnect = true;
    }
    cluster.disconnect(function() {
      logger.info('Master received SIGTERM. Killing/disconnecting it.');
    });
  });

} else if (cluster.isWorker) {
  // if the process is not a master

  // Set worker process title
  process.title = "OpenST-Platform node worker-"+cluster.worker.id;


  var app = express();

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // app.use(function(req, res, next) {
  //   inputRequest.run(function() {
  //     inputRequest.set('reqId', req.id);
  //     inputRequest.set('workerId', cluster.worker.id);
  //     var hrTime = process.hrtime();
  //     inputRequest.set('startTime', hrTime);
  //     next();
  //   });
  // });
  app.use(helmet());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(cookieParser());

  //The below peice of code should always be before routes.
  //Docs: https://www.npmjs.com/package/express-sanitized

  app.use(sanitizer());

  // load index routes
  app.use('/', indexRoutes);

  app.use('/chain-id/:chainId/block', blockRoutes);
  app.use('/chain-id/:chainId/blocks', blocksRoutes);
  app.use('/chain-id/:chainId/transactions', transactionsRoutes);
  app.use('/chain-id/:chainId/transaction', transactionRoutes);
  app.use('/chain-id/:chainId/address', addressRoutes);
  app.use('/chain-id/:chainId/search', searchRoutes);
  app.use('/chain-id/:chainId/contract', contractRoutes);


  /**
   * Get port from environment and store in Express.
   */

  var port = normalizePort(process.env.PORT || '3000');
  app.set('port', port);

  /**
   * Create HTTP server.
   */

  var server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(port, 443);
  server.on('error', onError);
  server.on('listening', onListening);

}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
}
