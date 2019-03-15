# OST View

OST VIEW is the home grown multi-chain block explorer from OST for OpenST Utility Blockchains.

To parse blockchains, OST VIEW uses the [OST Block Scanner](https://github.com/ostdotcom/ost-block-scanner/).

## Install

```bash
  git clone https://github.com/ostdotcom/ost-view.git
  cd ost-view/
  npm install
```

## Setup

### 1. Install Prerequisites 
- [nodejs](https://nodejs.org/) >= 8.0.0
- [Geth](https://github.com/ethereum/go-ethereum/) >=1.8.17
- [Memcached](https://memcached.org/)
- AWS DynamoDB Service OR [DynamoDBLocal.jar](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html)
- [Java](https://www.java.com/) >= 6.0, if using DynamoDBLocal.jar
- [DB Browser for SQLite](https://sqlitebrowser.org/) optionally to browse DynamoDB
    
### 2. Run DynamoDBLocal.jar, if you are not using AWS DynamoDB Service

```bash
  # NOTE: Make sure to change DYNAMODB_PATH
  export DYNAMODB_PATH=~/dynamodb_local_latest
  java -Djava.library.path=$DYNAMODB_PATH/DynamoDBLocal_lib/ -jar $DYNAMODB_PATH/DynamoDBLocal.jar -sharedDb -dbPath $DYNAMODB_PATH/
```

### 3. Create OST VIEW configuration file 
Refer to [configuration.json.example](configuration.json.example) to create a new configuration file.

### 4. Create Global DynamoDB tables: 

```bash
  node ./node_modules/@ostdotcom/ost-block-scanner/tools/initialSetup.js --configFile $(pwd)/configuration.json
```

### 5. Add a new chain and create chain-specific shared DynamoDB tables:
  * Mandatory parameters: `chainId`, `networkId`, `configFile`
  * Optional parameters (each defaults to 1):
    * `blockShardCount`: number of block shards to be created
    * `economyShardCount`: number of economy shards to be created
    * `economyAddressShardCount`: number of economy address shards to be created
    * `transactionShardCount`: number of transaction shards to be created

```bash
  # NOTE:
  # Make sure chain configuration is present in configuration file before starting this step. 
  # Optional parameters are used to create entity-specific sharded tables. 
  # By default only one shard is created for each entity. 
  node ./node_modules/@ostdotcom/ost-block-scanner/tools/addChain.js --configFile $(pwd)/configuration.json --chainId 2000 --networkId 1 --blockShardCount 2 --economyShardCount 2 --economyAddressShardCount 2 --transactionShardCount 2
```

_For additional configuration options, please see documentation for the [OST Block Scanner](https://github.com/ostdotcom/ost-block-scanner/)._

### 6. Add Global Stats DynamoDB table:

```bash
  node lib/models/tableCreation.js --configFile $(pwd)/configuration.json
```

## Start Block Scanner
  * Mandatory parameters: `chainId`, `configFile`
  * Optional parameters: startBlockNumber, endBlockNumber
```bash
  node ./node_modules/@ostdotcom/ost-block-scanner/executables/blockScanner.js --configFile $(pwd)/configuration.json --chainId 2000 --startBlockNumber 0 --endBlockNumber 100
```


## Start Global Stats Aggregator

```bash
  node executables/GlobalAggregatorCron.js --configFile $(pwd)/configuration.json
```

## Start OST VIEW application server

```bash
  npm start
```

With the browser of your choice, visit `http://<Hostname or IP>:<port mentioned in configuration.json>`.
