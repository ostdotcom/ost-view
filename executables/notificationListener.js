#!/usr/bin/env node
"use strict";

/**
 * Job to listen notification from notification service.
 *
 * @example
 * ./executables/notificationListener.js -c 1141
 *
 * @module executables/notificationListener.js
 */

const openSTNotification = require('@openstfoundation/openst-notification');

const rootPrefix = ".."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , notificationProcessor = require(rootPrefix + '/lib/notificationProcessor')
;

var unAckCount = 0;

function subscribe() {
  openSTNotification.subscribeEvent.rabbit(
    ['transfer.#', 'entity.#'],
    {
      queue: 'OpenST-Explorer-Notification-Listener',
      ackRequired: 1,
      prefetch: 1
    },
    function (msgContent) {
      logger.info('[RECEIVED]', msgContent, '\n');
      unAckCount++;
      return processNotification(JSON.parse(msgContent)['message']);
    }
  ).catch(function (err) {
    logger.error(err);
  });
}

// Start
logger.step("* Started the OpenST Notifications");
subscribe();

/**
 *
 * @param msgContent
 */
var processNotification = function (msgContent) {
  console.log("processNotification", msgContent);
  return new Promise(function (onResolve, onReject) {
    if (msgContent['kind'] == 'transaction_mined') {
      logger.info("New Transaction mined", msgContent['payload']);
      notificationProcessor.processTransaction(msgContent.payload).then(function () {
        logger.log("NotificationProcessor#processTransaction :: Transaction type inserted successfully");
        unAckCount--;
        onResolve();
      }).catch(function (err) {
        logger.error("NotificationProcessor#processTransaction :: Transaction type insertion error", err);
        unAckCount--;
        onResolve();
      });
    } else if (msgContent['kind'] == 'shared_entity') {

      unAckCount--;
      //TODO: function call to update branded token info.
      onResolve();

    } else {
      unAckCount--;
      onResolve();
    }
  });
};

process.on('SIGINT', function () {
  console.log('Received SIGINT, checking unAckCount.');
  var f = function () {
    if (unAckCount === 0) {
      process.exit(1);
    } else {
      console.log('waiting for open tasks to be done.');
      setTimeout(f, 1000);
    }
  };

  setTimeout(f, 1000);
});