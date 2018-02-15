OPENST-EXPLORER
============

## Prerequisite installations 

* Install node version >= 8.7.0
* Install geth version >= 1.7.2
* MySQL

## Setup OpenST utility chains 

* Go to OpenST Explorer repo directory
```
  > cd openst-explorer 
```

* Install Packages
```
  > npm install
```

* Start MySQL and Geth Node

* Create database in MySQL

* Configure database details in config.js
```
  > vim config.js
```
  > under chain_config hash update following values and pest 
```
    '<chain_id>': {
        chainId       : <chain_id>,
        database_type : "mysql",
        web_rpc       : "<Geth RPC URL>",
        poll_interval : <chain poll interval in milliseconds>,
        db_config     : {
            chainId         : <chain_id>,
            driver          : 'mysql',
            user            : '<mysql username>',
            password        : '<mysql password>',
            host            : '<mysql host>',
            database        : '<database name (created in above step)>',
            blockAttributes : ['miner','difficulty','totalDifficulty','gasLimit','gasUsed'], # Block attributes need to be populated in database, other columns will be null
            txnAttributes   : ['gas', 'gasPrice', 'input','nonce', 'contractAddress'] # Transaction attributes need to be populated in database, other columns will be null
        }
    }, 
```

 * Run migration
  > It will run migrations for all the configured chains
```
  > node executables/db_migrate.js up
```

  > To run migrations for specific chain specify chain Id
  ```
    > node executables/db_migrate.js up -c <chain_id>
  ```

* Start block fetcher
```
  > nohup node executables/block_fetcher_cron.js --chainID <chain_id> >> log/block_fetcher_cron.log &
```

* Start block verifier
```
  > nohup node executables/block_verifier_cron.js --chainID <chain_id> >> log/block_verifier_cron.log &
```
