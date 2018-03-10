"use strict";

/**
 * MemCache client to interact with MemCached
 */

const rooPrefix = ".."
  , constants = require(rooPrefix + '/config/core_constants');

var crypto = require('crypto');
var mysql = require('mysql');
var cacheModule = require('@openstfoundation/openst-cache');

module.exports = new MemCache();

function MemCache() {
    this.cacheTimeout = 300;
    this.MemcachedConnection = new cacheModule.cache(constants.CACHING_ENGINE, true);
    this.name = 'ostview'
}

MemCache.prototype.set = function(key, value, pCacheTimeout) {
    var oThis = this;

    var keyHash = crypto.createHash('sha256').update(key).digest("hex");

    return oThis.MemcachedConnection.set(this.name + keyHash, value, pCacheTimeout == undefined ? oThis.cacheTimeout: pCacheTimeout);
};

MemCache.prototype.get = function(key) {
    var oThis = this;

    var keyHash = crypto.createHash('sha256').update(key).digest("hex");

    return oThis.MemcachedConnection.get(this.name + keyHash);
};

MemCache.prototype.setObject = function(key, value, pCacheTimeout) {
    var oThis = this;

    var keyHash = crypto.createHash('sha256').update(key).digest("hex");

    return oThis.MemcachedConnection.setObject(this.name + keyHash, value, pCacheTimeout == undefined ? oThis.cacheTimeout: pCacheTimeout);
};

MemCache.prototype.getObject = function(key) {
    var oThis = this;

    var keyHash = crypto.createHash('sha256').update(key).digest("hex");

    return oThis.MemcachedConnection.getObject(this.name + keyHash);
};

MemCache.prototype.del = function(key) {
    var oThis = this;

    var keyHash = crypto.createHash('sha256').update(key).digest("hex");

    return oThis.MemcachedConnection.del(this.name + keyHash);
};

MemCache.prototype.finish = function() {
    this.MemcachedConnection.end();
};