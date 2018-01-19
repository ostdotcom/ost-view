OPENST-EXPLORER

# Local Development Environment

## Prerequisite installations 

* Install node version >= 8.7.0
* Install geth version >= 1.7.2

## Setup utility and value chains 

### In Terminal 1:

* Go to OpenST Explorer repo directory
```
  > cd openst-explorer 
```

* Install Packages
```
  > npm install
```

* Start MySQL

* Create database in MySQL

* Open config.json
```
  > cd openst-explorer 
  > vim config.js
```

* Create database entry in config.js
  > under chain_config hash update following values and pest 

	  '<chain_id>': {
	        chainId       : <chain_id>,
	        database_type : "mysql",
	        web_rpc       : "<RPC URL>",
	        cron_interval : <cron_interval_time>,
	        db_config     : {
	                chainId         : <chain_id>,
               	 driver          : 'mysql',
                	user            : '<mysql username>',
                	password        : '<mysql password>',
                	host            : 'localhost',
                	database        : '<database name(created in above step)>',
                    blockAttributes : ['miner','difficulty','totalDifficulty','gasLimit','gasUsed'],
                    txnAttributes   : ['gas', 'gasPrice', 'input','nonce', 'contractAddress']
	        }
	    }, 

  > save the changes.

* Run migration
```
  > cd openst-explorer 
  > node executables/db_migrate.js up --chainID <chain_id>
```

* Start Geth console

* Start block fetcher cron
```
  > cd openst-explorer 
  > node executables/block_fetcher_cron.js --chainID <chain_id> --blockNumber <block_number>
```

* By this time, your block fetcher start fetching blocks and storeing it in database.

### In Terminal 2:

* Start block verifier
```
  > cd openst-explorer 
  > node executables/block_verifier_cron.js --chainID <chain_id> 
```
