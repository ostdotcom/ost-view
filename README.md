OPENST-VIEW
============

## Prerequisite installations 

* Install node version >= 8.7.0
* Install geth version >= 1.7.2
* MySQL

## Setup OpenST utility chains 

* Go to OpenST Explorer repo directory and create home directory env path
```
  > cd openst-view
  > export OST_VIEW_PATH=$(pwd)
```

* Install Packages
```
  > npm install
```

* Start MySQL and Geth Node

* Create database in MySQL

 * Run migration
  > To run migrations for specific chain specify chain Id
  ```
    > $OST_VIEW_PATH/executables/db_migrate.js up -c <chain_id>
  ```
  > To run migrations for all the configured chains (make sure all databases are created.)
  ```
    > node $OST_VIEW_PATH/executables/db_migrate.js up
  ```

* Define chain configurations in set_env_vars.sh file
  > '0' in environment variable define configurations for one particular chain.
  > To Define configuration for multiple chains, define another set of environment
    variables having consecutive number.
    For example: OST_VIEW_1_CHAIN_ID, OST_VIEW_2_CHAIN_ID...

  ```
     # chain env
     export OST_VIEW_0_CHAIN_ID=<CHAIN_ID>
     export OST_VIEW_0_WEB_RPC=<WEB_RPC_URL>

     #DB env
     export OST_VIEW_0_DB_USER=<DB_USER_NAME>
     export OST_VIEW_0_DB_PWD=<DB_PASSWORD>

     export OST_VIEW_0_DB_NAME=<DB_NAME>

     export OST_VIEW_0_DB_HOST=<DB_URL>

     export OST_VIEW_0_DB_CONNECTION_LIMIT=<DB_CONNECTION_LIMT>
  ```

## In terminal 1
   * (Optional) Start notification listener(rabbitmq)
       > rabbitmq is required for notificationListener
       ```
           > cd openst-view
           > source set_env_vars.sh
           > ./executables/notificationListener.js
       ```

## In terminal 2
* Start node
  
    ```
     > cd openst-view
     > source set_env_vars.sh
     > npm start
     
     
## Start Cronjobs
```base
# Every five minute
node executables/graph_cron.js >> log/graph_cron.log
node executables/aggregator_cron.js -c <chain_id> >> log/aggregator_cron.log
# Every minute
node executables/block_fetcher_cron.js  -c <chain_id> >> log/block_fetcher_cron.log
node executables/block_verifier_cron.js  -c <chain_id> >> log/block_verifier_cron.log
node executables/populate_address_detail_cron.js -c <chain_id> >> log/block_verifier_cron.log
```     