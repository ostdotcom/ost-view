#!/usr/bin/env bash
#################
# opentST View Environment file
#################


# chain env 2000
export OST_VIEW_0_CHAIN_ID="2000"
export OST_VIEW_0_WEB_RPC="http://127.0.0.1:9546"

#DB env
export OST_VIEW_0_DB_USER="root"
export OST_VIEW_0_DB_PWD="rootroot"

export OST_VIEW_0_DB_NAME="ost_explorer_2000"

export OST_VIEW_0_DB_HOST="localhost"

export OST_VIEW_0_DB_CONNECTION_LIMIT=10

#DB env

#export OV_DEFAULT_MYSQL_HOST="localhost"
#export OV_DEFAULT_MYSQL_USER="root"
#export OV_DEFAULT_MYSQL_PASSWORD="root"



# Cache
export OST_CACHING_ENGINE='memcached'
export OST_DEFAULT_TTL='3600'
export OST_MEMCACHE_SERVERS='127.0.0.1:11211'
export OST_REDIS_HOST=''
export OST_REDIS_PORT=''
export OST_REDIS_PASS=''
export OST_REDIS_TLS_ENABLED='0'

# Notification
export OST_RMQ_SUPPORT='0'
export OST_RMQ_HOST='127.0.0.1'
export OST_RMQ_PORT='5672'
export OST_RMQ_USERNAME='guest'
export OST_RMQ_PASSWORD='guest'
export OST_RMQ_HEARTBEATS='10'

# JWT details
export JWT_API_SECRET_KEY='6p5BkI0uGHI1JPrAKP3eB1Zm88KZ84a9Th9o4syhwZhxlv0oe0'

#Home directory Path
export OST_VIEW_PATH='.'

#Web env variables

export DEFAULT_CHAIN_ID='2000';

export BASE_CONTRACT_ADDRESS='0';

export OST_VIEW_1409_UNAME="root";
export OST_VIEW_1409_PWD="root";

export OST_VIEW_ENVIRONMENT='development'
export OST_VIEW_SUB_ENVIRONMENT='main'
export OST_VIEW_SUB_ENVIRONMENT='main'
export MAINNET_BASE_URL = 'mainnetview.stagingost.com'
export TESTNET_BASE_URL = 'testnetview.stagingost.com'

export PUT_BASIC_AUTHENTICATION='false'

export NOTIFY_FROM_ADDRESS='notifier@ost.com'

export CLOUDFRONT_BASE_DOMAIN='dxwfxs8b4lg24.cloudfront.net'