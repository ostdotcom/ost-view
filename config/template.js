configTemplate = {};

configTemplate['rootLevelEntities'] = {
  cache: 'cacheEntity',
  storage: 'storageEntity',
  chains: 'chainsEntity',
  environment: 'environmentEntity',
  subEnvironment: 'subEnvironmentEntity',
  port: 'portEntity',
  workers: 'workersEntity',
  url: 'urlEntity',
  authentication: 'authenticationEntity',
  cdn: 'cdnEntity',
  notifier: 'notifierEntity',
  debugEnabled: 'debugEnabledEntity'
};

configTemplate['entitiesMap'] = {
  environmentEntity: {
    entityType: 'string'
  },
  subEnvironmentEntity: {
    entityType: 'string'
  },
  portEntity: {
    entityType: 'number'
  },
  workersEntity: {
    entityType: 'number'
  },
  urlEntity: {
    entityType: 'object',
    entitiesPresent: {
      current: 'currentEntity',
      mainnet: 'mainnetEntity',
      testnet: 'testnetEntity'
    }
  },
  currentEntity: {
    entityType: 'string'
  },
  mainnetEntity: {
    entityType: 'string'
  },
  testnetEntity: {
    entityType: 'string'
  },
  authenticationEntity: {
    entityType: 'object',
    entitiesPresent: {
      jwtSecretKey: 'jwtSecretKeyEntity',
      basicAuth: 'basicAuthEntity'
    }
  },
  basicAuthEntity: {
    entityType: 'object',
    entitiesPresent: {
      username: 'usernameEntity',
      password: 'passwordEntity',
      isEnabled: 'isEnabledEntity'
    }
  },
  jwtSecretKeyEntity: {
    entityType: 'string'
  },
  usernameEntity: {
    entityType: 'string'
  },
  passwordEntity: {
    entityType: 'string'
  },
  isEnabledEntity: {
    entityType: 'string'
  },
  cdnEntity: {
    entityType: 'object',
    entitiesPresent: {
      domain: 'domainEntity'
    }
  },
  debugEnabledEntity: {
    entityType: 'string'
  },
  notifierEntity: {
    entityType: 'object',
    entitiesPresent: {
      isRmqEnabled: 'isRmqEnabledEntity',
      rabbitmq: 'rabbitmqEntity',
      fromAddress: 'fromAddressEntity',
      toAddress: 'toAddressEntity'
    }
  },
  isRmqEnabledEntity: {
    entityType: 'string'
  },
  rabbitmqEntity: {
    entityType: 'object',
    entitiesPresent: {
      rmqHost: 'rmqHostEntity',
      password: 'passwordEntity',
      username: 'usernameEntity',
      port: 'portEntity',
      rmqclusterNodes: 'rmqclusterNodesEntity',
      rmqHeartBeats: 'rmqHeartBeatsEntity'
    }
  },
  rmqHostEntity: {
    entityType: 'string'
  },
  rmqclusterNodesEntity: {
    entityType: 'array',
    entitiesPresent: 'serverEntity' //For an array entity this array will contain entity types which that array will hold
  },
  rmqHeartBeatsEntity: {
    entityType: 'number'
  },
  fromAddressEntity: {
    entityType: 'string'
  },
  toAddressEntity: {
    entityType: 'string'
  },
  cacheEntity: {
    entityType: 'object',
    entitiesPresent: {
      engine: 'engineEntity',
      servers: 'serversEntity',
      defaultTtl: 'defaultTtlEntity'
    }
  },
  engineEntity: {
    entityType: 'string'
  },
  serversEntity: {
    entityType: 'array',
    entitiesPresent: 'serverEntity' //For an array entity this array will contain entity types which that array will hold
  },
  serverEntity: {
    entityType: 'string'
  },
  defaultTtlEntity: {
    entityType: 'number'
  },
  storageEntity: {
    entityType: 'object',
    entitiesPresent: {
      endpoint: 'endpointEntity',
      region: 'regionEntity',
      apiKey: 'apiKeyEntity',
      apiSecret: 'apiSecretEntity',
      apiVersion: 'apiVersionEntity',
      enableSsl: 'enableSslEntity',
      enableLogging: 'enableLoggingEntity',
      enableAutoscaling: 'enableAutoscalingEntity',
      autoScaling: 'autoScalingEntity'
    }
  },
  endpointEntity: {
    entityType: 'string'
  },
  regionEntity: {
    entityType: 'string'
  },
  apiKeyEntity: {
    entityType: 'string'
  },
  apiSecretEntity: {
    entityType: 'string'
  },
  apiVersionEntity: {
    entityType: 'string'
  },
  enableSslEntity: {
    entityType: 'string'
  },
  enableLoggingEntity: {
    entityType: 'string'
  },
  enableAutoscalingEntity: {
    entityType: 'string'
  },
  autoScalingEntity: {
    entityType: 'object',
    entitiesPresent: {
      endpoint: 'endpointEntity',
      region: 'regionEntity',
      apiKey: 'apiKeyEntity',
      apiSecret: 'apiSecretEntity',
      apiVersion: 'apiVersionEntity',
      enableSsl: 'enableSslEntity'
    }
  },
  chainsEntity: {
    entityType: 'array',
    entitiesPresent: 'chainEntity'
  },
  chainEntity: {
    entityType: 'object',
    entitiesPresent: {
      chainId: 'chainIdEntity',
      cache: 'cacheEntity',
      nodes: 'nodesEntity'
    }
  },
  chainIdEntity: {
    entityType: 'number'
  },
  nodesEntity: {
    entityType: 'array',
    entitiesPresent: 'nodeEntity'
  },
  nodeEntity: {
    entityType: 'object',
    entitiesPresent: {
      client: 'clientEntity',
      wsEndpoint: 'wsEndpointEntity',
      rpcEndpoint: 'rpcEndpointEntity'
    }
  },
  clientEntity: {
    entityType: 'string'
  },
  wsEndpointEntity: {
    entityType: 'string'
  },
  rpcEndpointEntity: {
    entityType: 'string'
  }
};

module.exports = configTemplate;
