/**
 * Main application file.
 *
 * @module app
 */

// Load all external modules.
const express = require('express'),
  path = require('path'),
  bodyParser = require('body-parser'),
  helmet = require('helmet'),
  http = require('http'),
  cluster = require('cluster'),
  exphbs = require('express-handlebars'),
  basicAuth = require('basic-auth'),
  morgan = require('morgan'),
  customUrlParser = require('url');

morgan.token('id', function getId(req) {
  return req.id;
});

// Load all required internal files.
const rootPrefix = '.',
  blockRoutes = require(rootPrefix + '/routes/block'),
  indexRoutes = require(rootPrefix + '/routes/index'),
  aboutRoutes = require(rootPrefix + '/routes/about'),
  statsRoutes = require(rootPrefix + '/routes/stats'),
  tokenRoutes = require(rootPrefix + '/routes/token'),
  searchRoutes = require(rootPrefix + '/routes/search'),
  sanitizer = require(rootPrefix + '/helpers/sanitizer'),
  addressRoutes = require(rootPrefix + '/routes/address'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  transactionRoutes = require(rootPrefix + '/routes/transaction'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  handlebarHelper = require(rootPrefix + '/helpers/handlebarHelper'),
  customMiddleware = require(rootPrefix + '/helpers/customMiddleware'),
  tokenDetailsBySymbolRoutes = require(rootPrefix + '/routes/tokenDetailsBySymbol');

const startRequestLog = function(req, res, next) {
  logger.requestStartLog(customUrlParser.parse(req.originalUrl).pathname, req.method);

  return next();
};

// Url prefix can only be testnet or mainnet.
const validateUrlPrefix = function(req, res, next) {
  const isValidUrlPrefix = [coreConstants.MAINNET_BASE_URL_PREFIX, coreConstants.TESTNET_BASE_URL_PREFIX].includes(
    req.params.baseUrlPrefix
  );

  if (isValidUrlPrefix) {
    return next();
  }

  return responseHelper.error('404', 'Not found').renderResponse(res, 404);
};

const redirectHome = function(req, res) {
  res.redirect(301, '/');
};

const basicAuthentication = function(req, res, next) {
  if (coreConstants.USE_BASIC_AUTHENTICATION === 'false') {
    return next();
  }

  function unauthorized() {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');

    return responseHelper.error('401', 'Unauthorized').renderResponse(res, 401);
  }

  const user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  }

  if (
    user.name === coreConstants.BASIC_AUTHENTICATION_USERNAME &&
    user.pass === coreConstants.BASIC_AUTHENTICATION_PASSWORD
  ) {
    return next();
  }

  return unauthorized(res);
};

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // Named pipe.
    return val;
  }

  if (port >= 0) {
    // Port number.
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 *
 * @param {object} error
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // Handle specific listen errors with friendly messages.
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
 *
 * @param {object} server
 */
function onListening(server) {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
}

// If the process is a master.
if (cluster.isMaster) {
  // Set worker process title
  process.title = 'OST View master node';

  // Fork workers equal to number of CPUs
  const numWorkers = coreConstants.WORKERS || require('os').cpus().length;

  for (let index = 0; index < numWorkers; index++) {
    // Spawn a new worker process.
    cluster.fork();
  }

  // Worker started listening and is ready
  cluster.on('listening', function(worker, address) {
    logger.info('[worker-' + worker.id + '] is listening to ' + address.address + ':' + address.port);
  });

  // Worker came online. Will start listening shortly
  cluster.on('online', function(worker) {
    logger.info('[worker-' + worker.id + '] is online');
  });

  //  Called when all workers are disconnected and handles are closed.
  cluster.on('disconnect', function(worker) {
    logger.error('[worker-' + worker.id + '] is disconnected');
  });

  // When any of the workers die the cluster module will emit the 'exit' event.
  cluster.on('exit', function(worker, code, signal) {
    if (worker.exitedAfterDisconnect === true) {
      // Don't restart worker as voluntary exit.
      logger.info('[worker-' + worker.id + '] voluntary exit. signal: ${signal}. code: ${code}');
    } else {
      // Restart worker as died unexpectedly.
      logger.error(
        '[worker-' + worker.id + '] restarting died. signal: ${signal}. code: ${code}',
        worker.id,
        signal,
        code
      );
      cluster.fork();
    }
  });

  // When someone try to kill the master process kill <master process id>
  process.on('SIGTERM', function() {
    for (const id in cluster.workers) {
      cluster.workers[id].exitedAfterDisconnect = true;
    }
    cluster.disconnect(function() {
      logger.info('Master received SIGTERM. Killing/disconnecting it.');
    });
  });
} else if (cluster.isWorker) {
  // If the process is not a master.

  // Set worker process title
  process.title = 'OST View worker-' + cluster.worker.id;

  const app = express();

  // Load custom middleware and set the worker id
  app.use(customMiddleware({ worker_id: cluster.worker.id }));
  app.use(
    morgan(
      '[:id] :remote-addr - :remote-user [:date[clf]] :method :url :response-time HTTP/:http-version" :status :res[content-length] :referrer :user-agent'
    )
  );

  app.use(helmet());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Sanitize request body and query params
  // NOTE: dynamic variables in URL will be sanitized in routes
  app.use(sanitizer.sanitizeBodyAndQuery);

  // Keep health checker here to skip basic auth
  app.get('/health-checker', function(req, res) {
    res.send('');
  });

  // Add basic auth in chain
  app.use(basicAuthentication);

  // Setting view engine template handlebars.
  app.set('views', path.join(__dirname, 'views'));

  // Helper is used to ease stringifying JSON.
  app.engine(
    'handlebars',
    exphbs({
      defaultLayout: 'main',
      helpers: handlebarHelper,
      partialsDir: path.join(__dirname, 'views/partials'),
      layoutsDir: path.join(__dirname, 'views/layouts')
    })
  );
  app.set('view engine', 'handlebars');

  // Module connect-assets relies on to use defaults in config.
  const connectAssetConfig = {
    paths: [path.join(__dirname, 'assets/css'), path.join(__dirname, 'assets/js')],
    buildDir: path.join(__dirname, 'builtAssets'),
    fingerprinting: true,
    servePath: 'assets'
  };

  if (coreConstants.IS_VIEW_ENVIRONMENT_PRODUCTION || coreConstants.IS_VIEW_ENVIRONMENT_STAGING) {
    connectAssetConfig.servePath = coreConstants.CLOUD_FRONT_BASE_DOMAIN + '/ost-view/js-css';
    connectAssetConfig.bundle = true;
    connectAssetConfig.compress = true;
  }

  const connectAssets = require('connect-assets')(connectAssetConfig);
  app.use(connectAssets);

  const hbs = require('handlebars');
  hbs.registerHelper('css', function() {
    const css = connectAssets.options.helperContext.css.apply(this, arguments);

    return new hbs.SafeString(css);
  });

  hbs.registerHelper('js', function() {
    const js = connectAssets.options.helperContext.js.apply(this, arguments);

    return new hbs.SafeString(js);
  });

  hbs.registerHelper('with', function(context, options) {
    return options.fn(context);
  });

  app.use(express.static(path.join(__dirname, 'public')));

  const redirectIfOnUrl = '/' + coreConstants.MAINNET_BASE_URL_PREFIX;

  // Load route files.
  app.get(redirectIfOnUrl, redirectHome);

  app.use('/', indexRoutes);
  app.use('/about', startRequestLog, aboutRoutes);
  // app.use('/:tokenSymbol', startRequestLog, tokenDetailsBySymbolRoutes);
  app.use('/:baseUrlPrefix/:tokenSymbol', startRequestLog, validateUrlPrefix, tokenDetailsBySymbolRoutes);
  app.use('/:baseUrlPrefix/stats', startRequestLog, statsRoutes);

  app.use('/:baseUrlPrefix/search', startRequestLog, validateUrlPrefix, searchRoutes);

  app.use('/:baseUrlPrefix/block', startRequestLog, validateUrlPrefix, blockRoutes);
  app.use('/:baseUrlPrefix/transaction', startRequestLog, validateUrlPrefix, transactionRoutes);
  app.use('/:baseUrlPrefix/token', startRequestLog, validateUrlPrefix, tokenRoutes);
  app.use('/:baseUrlPrefix/address', startRequestLog, validateUrlPrefix, addressRoutes);

  app.use('/:baseUrlPrefix', startRequestLog, validateUrlPrefix, indexRoutes);

  // Catch 404 and forward to error handler.
  app.use(function(req, res) {
    return responseHelper.error('404', 'Not Found').renderResponse(res, 404);
  });

  // Error handler.
  app.use(function(err, req, res) {
    // Set locals, only providing error in development.
    logger.error(err);

    return responseHelper.error('500', 'Something went wrong.').renderResponse(res, 500);
  });

  /**
   * Get port from environment and store in Express.
   */
  const port = normalizePort(coreConstants.PORT || '7000');
  app.set('port', port);

  /**
   * Create HTTP server.
   */
  const server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(port, 443);
  server.on('error', onError);
  server.on('listening', function() {
    onListening(server);
  });
}
