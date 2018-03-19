"use strict";
/*
 * Manage mysql clusters and connection pools
 */
var rootPrefix = '..'
  , mysql = require('mysql')
  , mysqlConfig = require(rootPrefix + '/config/mysql')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , poolClusters = {};


const generatePoolClusters = {

  // creating pool cluster object in poolClusters map
  generateCluster: function(cName, dbName, cConfig) {
    var oThis = this
      , clusterName = cName + "." + dbName;

    // initializing the pool cluster obj using the commonClusterConfig
    poolClusters[clusterName] = mysql.createPoolCluster(mysqlConfig["commonClusterConfig"]);

    // looping over each node and adding it to the pool cluster obj
    for (var nName in cConfig) {
      var finalConfig = Object.assign({}, cConfig[nName], mysqlConfig["commonNodeConfig"], {"database": dbName});
      poolClusters[clusterName].add(nName, finalConfig);
    }

    // when a node dis-functions, it is removed from the pool cluster obj and following CB is called
    poolClusters[clusterName].on('remove', function (nodeId) {
      logger.notify('m_w_1', 'REMOVED NODE : ' + nodeId + " in " + clusterName);
    });
  },

  // this loops over all the databases and creates pool cluster objects map in poolClusters
  init: function () {
    var oThis = this;
    // looping over all databases
    for (var dbName in mysqlConfig["databases"]) {
      var dbClusters = mysqlConfig["databases"][dbName];
      // looping over all clusters for the database
      for(var i=0; i < dbClusters.length; i++){
        var cName = dbClusters[i]
          , cConfig = mysqlConfig["clusters"][cName];

        // creating pool cluster object in poolClusters map
        oThis.generateCluster(cName, dbName, cConfig);
      }
    }
  }

};

generatePoolClusters.init();

// helper methods for mysql pool clusters
const mysqlWrapper = {

  getPoolFor: function (dbName, nodeType, clusterName) {
    if (!clusterName) {
      var clusterNames = mysqlConfig["databases"][dbName];
      if (clusterNames.length > 1) {
        throw 'Multiple clusters are defined for this DB. Specify cluster name.';
      }
      clusterName = clusterNames[0];
    }
    var dbClusterName = clusterName + "." + dbName
      , sanitizedNType = (nodeType == "slave" ? 'slave*' : 'master');
    return poolClusters[dbClusterName].of(sanitizedNType);
  },

  getPoolClustersFor: function (dbName) {
    var clusterPools = []
      , clusterNames = mysqlConfig["databases"][dbName];
    for (var i=0; i < clusterNames.length; i++) {
      clusterPools.push(mysqlWrapper.getPoolFor(dbName, clusterNames[i], 'master'));
    }
    return clusterPools;
  }
};

module.exports = mysqlWrapper;