
"use strict";

/*
 * Main application file
 *
 */

//All Module Requires.
const express = require('express')
  , path = require('path')
  , favicon = require('serve-favicon')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , basicAuth = require('express-basic-auth')
  , helmet = require('helmet')
  , sanitizer = require('express-sanitized')
;

//All the requires.
const rootPrefix    = "."
  , indexRoutes     = require( rootPrefix + '/routes/index')
  , blockRoutes     = require( rootPrefix + '/routes/block')
  , blocksRoutes     = require( rootPrefix + '/routes/blocks')
  , transactionsRoutes     = require( rootPrefix + '/routes/transactions')
  , transactionRoutes     = require( rootPrefix + '/routes/transaction')
  ,addressRoutes   = require( rootPrefix + '/routes/address')
  ,searchRoutes   = require( rootPrefix + '/routes/search')
;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('combined'));
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

//app.use(express.static(path.join(__dirname, 'public')));

/*
  The below peice of code should always be before routes.
  Docs: https://www.npmjs.com/package/express-sanitized
*/
app.use(sanitizer());

// load index routes
app.use('/', indexRoutes);

app.use('/utility-chain/block', blockRoutes);
app.use('/utility-chain/blocks', blocksRoutes);
app.use('/utility-chain/transactions', transactionsRoutes);
app.use('/utility-chain/transaction', transactionRoutes);
app.use('/utility-chain/address', addressRoutes);
app.use('/utility-chain/search', searchRoutes);



module.exports = app;