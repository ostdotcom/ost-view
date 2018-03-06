#!/usr/bin/env bash
#################
# opentST View Environment file
#################


# chain env 2000
export OST_VIEW_0_CHAIN_ID="142"
export OST_VIEW_0_WEB_RPC="http://devUtilityChain.com:9546"

#DB env
export OST_VIEW_0_DB_USER="pepo"
export OST_VIEW_0_DB_PWD="pepo123"

export OST_VIEW_0_DB_NAME="ost_explorer_142"

export OST_VIEW_0_DB_HOST="localhost"

export OST_VIEW_0_DB_CONNECTION_LIMIT=10


# chain env 2001
export OST_VIEW_1_CHAIN_ID="2001"
export OST_VIEW_1_WEB_RPC="http://devValueChain.com:8545"

#DB env
export OST_VIEW_1_DB_USER="root"
export OST_VIEW_1_DB_PWD="root"

export OST_VIEW_1_DB_NAME="ost_explorer_2001"

export OST_VIEW_1_DB_HOST="localhost"

export OST_VIEW_1_DB_CONNECTION_LIMIT=10


# chain env 142
export OST_VIEW_2_CHAIN_ID="142"
export OST_VIEW_2_WEB_RPC="http://devUtilityChain.com:9546"

#DB env
export OST_VIEW_2_DB_USER="root"
export OST_VIEW_2_DB_PWD="root"

export OST_VIEW_2_DB_NAME="ost_explorer_142"

export OST_VIEW_2_DB_HOST="localhost"

export OST_VIEW_2_DB_CONNECTION_LIMIT=10

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

export CHAIN_ID='142';

export BASE_CONTRACT_ADDRESS='0';

export OST_VIEW_2000_UNAME="root";
export OST_VIEW_2000_PWD="root";