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

* Create DB with name define in dbconfig.json
```
  > db-migrate up --config ./config/dbconfig.json --env stage
```

* Start Block fetching Cron Job
```
  > source test/openst_env_vars.sh
```

* Start Block fetching Cron Job with chainNumber
```
  > ./test/block_fetcher.js
```