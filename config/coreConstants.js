'use strict';
/**
 * Load all the core constants.
 *
 * @module config/coreConstants
 */
const rootPrefix = '..',
  Configuration = require(rootPrefix + '/helpers/Configuration');

const configuration = Configuration.getConfigStrategy();

/**
 * Class for core constants
 *
 * @class
 */
class CoreConstants {
  /**
   * Constructor for core constants
   *
   * @constructor
   */
  constructor() {}

  /**
   * Main sub environment string
   *
   * @returns {*}
   */
  get VIEW_SUB_ENVIRONMENT_MAIN() {
    return 'main';
  }

  /**
   * Sandbox sub environment string
   *
   * @returns {*}
   */
  get VIEW_SUB_ENVIRONMENT_SANDBOX() {
    return 'sandbox';
  }

  /**
   * Production environment string
   *
   * @returns {*}
   */
  get VIEW_ENVIRONMENT_PRODUCTION() {
    return 'production';
  }

  /**
   * Staging environment string
   *
   * @returns {*}
   */
  get VIEW_ENVIRONMENT_STAGING() {
    return 'staging';
  }

  /**
   * Development environment string
   *
   * @returns {*}
   */
  get VIEW_ENVIRONMENT_DEVELOPMENT() {
    return 'development';
  }

  /**
   * Debug enabled
   *
   * @returns {*}
   */
  get DEBUG_ENABLED() {
    return configuration.debugEnabled;
  }

  /**
   * Get express workers count
   *
   * @returns {*}
   */
  get WORKERS() {
    return configuration.workers;
  }

  /**
   * Get express port
   *
   * @returns {*}
   */
  get PORT() {
    return configuration.port;
  }

  /**
   * Use basic auth or not
   *
   * @returns {*}
   */
  get USE_BASIC_AUTHENTICATION() {
    return configuration.authentication.basicAuth.isEnabled;
  }

  /**
   * Use basic auth or not
   *
   * @returns {*}
   */
  get BASIC_AUTHENTICATION_USERNAME() {
    return configuration.authentication.basicAuth.username;
  }

  /**
   * Use basic auth or not
   *
   * @returns {*}
   */
  get BASIC_AUTHENTICATION_PASSWORD() {
    return configuration.authentication.basicAuth.password;
  }

  /**
   * Returns configuration
   *
   * @returns {Object}
   */
  get CONFIG_STRATEGY() {
    return configuration;
  }

  /**
   * Returns VIEW_SUB_ENVIRONMENT
   *
   * @returns {String}
   */
  get VIEW_SUB_ENVIRONMENT() {
    return configuration.subEnvironment;
  }

  /**
   * Returns VIEW_ENVIRONMENT
   *
   * @returns {String}
   */
  get VIEW_ENVIRONMENT() {
    return configuration.environment;
  }

  /**
   * Returns MAINNET_BASE_URL_PREFIX
   *
   * @returns {String}
   */
  get MAINNET_BASE_URL_PREFIX() {
    return 'mainnet';
  }

  /**
   * Returns TESTNET_BASE_URL_PREFIX
   *
   * @returns {String}
   */
  get TESTNET_BASE_URL_PREFIX() {
    return 'testnet';
  }

  /**
   * Returns BASE_URL_PREFIX
   *
   * @returns {String}
   */
  get BASE_URL_PREFIX() {
    return this.IS_VIEW_SUB_ENVIRONMENT_MAIN ? this.MAINNET_BASE_URL_PREFIX : this.TESTNET_BASE_URL_PREFIX;
  }

  /**
   * Is sub environment main
   *
   * @returns {Boolean}
   */
  get IS_VIEW_SUB_ENVIRONMENT_MAIN() {
    return this.VIEW_SUB_ENVIRONMENT == this.VIEW_SUB_ENVIRONMENT_MAIN;
  }

  /**
   * Is sub environment sandbox
   *
   * @returns {Boolean}
   */
  get IS_VIEW_SUB_ENVIRONMENT_SANDBOX() {
    return this.VIEW_SUB_ENVIRONMENT == this.VIEW_SUB_ENVIRONMENT_MAIN;
  }

  /**
   * Is environment production
   *
   * @returns {Boolean}
   */
  get IS_VIEW_ENVIRONMENT_PRODUCTION() {
    return this.VIEW_ENVIRONMENT == this.VIEW_ENVIRONMENT_PRODUCTION;
  }

  /**
   * Is environment staging
   *
   * @returns {Boolean}
   */
  get IS_VIEW_ENVIRONMENT_STAGING() {
    return this.VIEW_ENVIRONMENT == this.VIEW_ENVIRONMENT_STAGING;
  }

  /**
   * Is environment development
   *
   * @returns {Boolean}
   */
  get IS_VIEW_ENVIRONMENT_DEVELOPMENT() {
    return this.VIEW_ENVIRONMENT == this.VIEW_ENVIRONMENT_DEVELOPMENT;
  }

  /**
   * Returns CLOUD_FRONT_BASE_DOMAIN
   *
   * @returns {String}
   */
  get CLOUD_FRONT_BASE_DOMAIN() {
    return configuration.cdn.domain;
  }

  /**
   * Returns JWT secret key
   *
   * @returns {String}
   */
  get JWT_SECRET_KEY() {
    return configuration.authentication.jwtSecretKey;
  }

  /***************************** Configuration ************************/

  /**
   * Returns default page size
   *
   * @returns {Number}
   */
  get DEFAULT_PAGE_SIZE() {
    return 10;
  }

  /**
   * Returns home template
   *
   * @returns {*}
   */
  get home() {
    return 'home';
  }

  /**
   * Returns transactionList template
   *
   * @returns {*}
   */
  get contractInternalTransactions() {
    return 'transactionList';
  }

  /**
   * Returns tokenDetails template
   *
   * @return {String}
   */
  get tokenDetails() {
    return 'tokenDetails';
  }

  /**
   * Returns addressDetails template
   *
   * @return {String}
   */
  get addressDetails() {
    return 'addressDetails';
  }

  /**
   * Returns blocks template
   *
   * @return {String}
   */
  get blocks() {
    return 'home';
  }

  /**
   * Returns transactionDetails template
   *
   * @return {String}
   */
  get transaction() {
    return 'transactionDetails';
  }

  /**
   * Returns blockDetail template
   *
   * @return {String}
   */
  get block() {
    return 'blockDetail';
  }

  /**
   * Returns addressDetails template
   *
   * @return {String}
   */
  get addressDetails() {
    return 'addressDetails';
  }

  /**
   * Returns tokenAddressDetails template
   *
   * @return {String}
   */
  get tokenAddressDetails() {
    return 'tokenAddressDetails';
  }

  /**
   * Returns searchResults template
   *
   * @return {String}
   */
  get searchResults() {
    return 'searchResult';
  }

  /**
   * Returns about template
   *
   * @return {String}
   */
  get about() {
    return 'about';
  }

  /**
   * Returns error string when data is not unavailable
   *
   * @returns {String}
   */
  get DEFAULT_DATA_NOT_AVAILABLE_TEXT() {
    return 'Data not available. Please check the input parameters.';
  }

  /**
   * Returns transaction hash length
   *
   * @returns {Number}
   */
  get TRANSACTION_HASH_LENGTH() {
    return 66;
  }

  /**
   * Returns account hash length
   *
   * @returns {Number}
   */
  get ETH_ADDRESS_LENGTH() {
    return 42;
  }

  /**
   * Return block entity
   *
   * @returns {string}
   */
  get blockEntity() {
    return 'block';
  }

  /**
   * Return transaction hash entityname
   *
   * @returns {string}
   */
  get transactionEntity() {
    return 'transaction';
  }

  /**
   * Return token holder entityname
   *
   * @returns {string}
   */
  get tokenHolderEntity() {
    return 'tokenHolder';
  }

  /**
   * Return token entity name
   *
   * @returns {string}
   */
  get tokenEntity() {
    return 'token';
  }

  /**
   * Return address entity name
   *
   * @returns {string}
   */
  get addressEntity() {
    return 'address';
  }
  /**
   * Returns package name
   *
   * @return {string}
   */
  get icNameSpace() {
    return 'ostView';
  }
}

module.exports = new CoreConstants();
