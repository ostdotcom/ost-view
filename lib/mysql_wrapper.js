"use strict";
/*
 * Manage mysql clusters and connection pools
 */
var rootPrefix = '..'
  , mysql = require('mysql')
  , config = require(rootPrefix + '/config')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , poolClusters = {};


const generatePoolClusters = {

  // creating pool cluster object in poolClusters map
  generateCluster: function(cName, dbName, cConfig) {
    var oThis = this
      , clusterName = cName + "." + dbName;

    // initializing the pool cluster obj using the commonClusterConfig
    poolClusters[clusterName] = mysql.createPoolCluster(config.getCommonClusterConfig());

    // looping over each node and adding it to the pool cluster obj
    for (var nName in cConfig) {
      var finalConfig = Object.assign({}, cConfig[nName], config.getCommonNodeConfig(), {"database": dbName});
      poolClusters[clusterName].add(nName, finalConfig);
    }

    // when a node dis-functions, it is removed from the pool cluster obj and following CB is called
    poolClusters[clusterName].on('remove', function (nodeId) {
      logger.notify('m_w_1', 'REMOVED NODE : ' + nodeId + " in " + clusterName);
    });
  },

  // this loops over all the databases and creates pool cluster objects map in poolClusters
  init: function () {
    const oThis = this;
    // looping over all databases
    const chainIdArray = config.getAllChainIDs();
    for (let ind in chainIdArray) {
      const chainId = chainIdArray[ind];
      const mysqlConfig = config.getMysqlDbConfig(chainId);
      const dbClusters = mysqlConfig.databases[mysqlConfig.dbName];
      // looping over all clusters for the database
      for(let i=0; i < dbClusters.length; i++){
        const cName = dbClusters[i]
          , cConfig = mysqlConfig["clusters"][cName];

        // creating pool cluster object in poolClusters map
        oThis.generateCluster(cName, mysqlConfig.dbName, cConfig);
      }
    }
  }

};

generatePoolClusters.init();

// helper methods for mysql pool clusters
const mysqlWrapper = {

  getPoolFor: function (mysqlConfig, nodeType, clusterName) {
    if (!clusterName) {
      var clusterNames = mysqlConfig["databases"][mysqlConfig.dbName];
      if (clusterNames.length > 1) {
        throw 'Multiple clusters are defined for this DB. Specify cluster name.';
      }
      clusterName = clusterNames[0];
    }
    var dbClusterName = clusterName + "." + mysqlConfig.dbName
      , sanitizedNType = (nodeType == "slave" ? 'slave*' : 'master');
    return poolClusters[dbClusterName].of(sanitizedNType);
  },

  getPoolClustersFor: function (mysqlConfig) {
    var clusterPools = []
      , clusterNames = mysqlConfig["databases"][mysqlConfig.dbName];
    for (var i=0; i < clusterNames.length; i++) {
      clusterPools.push(mysqlWrapper.getPoolFor(mysqlConfig.dbName, clusterNames[i], 'master'));
    }
    return clusterPools;
  }
};

module.exports = mysqlWrapper;