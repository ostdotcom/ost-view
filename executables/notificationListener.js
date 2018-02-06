#!/usr/bin/env node
"use strict";


const rootPrefix = "../..",
    notification = require(rootPrefix + "/openst-notification/index");

console.log("made connection");
notification.subscribe_event.rabbit(["events.transfer"], function (event){
   console.log("Event received :", event);
});