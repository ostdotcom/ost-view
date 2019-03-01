# OST View

OST VIEW is the home grown block explorer from OST for OpenST Utility Blockchains.

# Setting up development environment

Clone the repo to the directory of your choice.

### Installation
Run `npm install` in the repository root folder.

Make sure you have dynamoDb is installed. Once installed, start DynamoDb with the data directory of your choice.

`java -Djava.library.path=~/dynamodb_local_latest/DynamoDBLocal_lib/ -jar ~/dynamodb_local_latest/DynamoDBLocal.jar -sharedDb -dbPath $datadir`

Clone `configuration.json.example` file as `configuration.json` in the current repository's root directory.

Change Geth, Memcached, DynamoDb keys in `configuration.json` appropriately.

Make sure GETH is running as per the `configuration.json` file and accessible to block scanning.

Once all the services are up and running, start creating Dynamo shards as follows.

### Create Dynamo shards

Create shared tables with below command.
`node node_modules/@ostdotcom/ost-block-scanner/tools/initialSetup.js --configFile $PWD'/configuration.json'`

Run `node node_modules/@ostdotcom/ost-block-scanner/tools/addChain.js --help`. Check all the required params. Below is an 
example of ways you can run `addChain.js` to create 1 shard of each type and 2 block shards.

`node node_modules/@ostdotcom/ost-block-scanner/tools/addChain.js --chainId 1000 --networkId 1 --blockShardCount 2 --economyShardCount 2 --economyAddressShardCount 2 --transactionShardCount 2 --configFile $PWD'/configuration.json'`

Create table for global stats of home page.
`node lib/models/tableCreation.js --configFile $PWD'/configuration.json'`

### Start block scanner

At this point you have all the required shards to start the block scanner. Start the block scanner with below command.

`node node_modules/@ostdotcom/ost-block-scanner/executables/blockScanner.js --chainId 1000 --configFile $PWD/configuration.json --startBlockNumber 0`

### Start Explorer

Block scanner will be dumping chain data to the dynamo shards. Now you can start explorer with below command.

`npm start`

Go to the browser of your choice at `http://localhost:<port mentioned in configuration.json>`.

### Start Global Aggregator

Run `node executables/GlobalAggregatorCron.js --configFile $(pwd)/configuration.json`