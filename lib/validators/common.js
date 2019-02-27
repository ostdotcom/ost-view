'use strict';
/**
 * Common Validators
 *
 * @module lib/validators/common
 */

const rootPrefix = '../..';

/**
 * Class for common validators
 *
 * @class
 */
class CommonValidator {
  constructor() {}

  /**
   *
   * Is var null ?
   *
   * @return {Boolean}
   *
   */
  static isVarNull(variable) {
    return typeof variable === 'undefined' || variable == null;
  }

  /**
   *
   * Is var null ?
   *
   * @return {Boolean}
   *
   */
  static isVarTrue(variable) {
    return variable === true || variable === 'true';
  }

  /**
   *
   * Is var null ?
   *
   * @return {Boolean}
   *
   */
  static isVarFalse(variable) {
    return variable === false || variable === 'false';
  }

  /**
   *
   * Is var integer ?
   *
   * @return {Boolean}
   *
   */
  static isVarInteger(variable) {
    if (typeof variable === 'number') {
      return variable % 1 === 0;
    } else {
      let number = Number(variable);
      if (isNaN(number)) {
        return false;
      } else {
        return CommonValidator.isVarInteger(number);
      }
    }
  }

  /**
   * Checks if the given string is an address
   *
   * @param address {String} address the given HEX address
   *
   * @return {Boolean}
   */
  static isEthAddressValid(address) {
    const oThis = this;

    if (oThis.isVarNull(address) || typeof address !== 'string' || address == '') {
      return false;
    }

    address = address.trim().toLowerCase();

    return /^(0x)?[0-9a-f]{40}$/i.test(address);
  }

  /**
   * Check if transaction hash is valid or not
   *
   * @param {String} transactionHash - Transaction hash
   *
   * @return {Boolean}
   */
  static isTxHashValid(transactionHash) {
    if (typeof transactionHash !== 'string') {
      return false;
    }
    return /^0x[0-9a-fA-F]{64}$/.test(transactionHash);
  }

  /**
   * Check if token name is valid or not
   *
   * @param {String} tokenName - Token name
   *
   * @return {Boolean}
   */
  static isTokenNameValid(tokenName) {
    if (typeof tokenName !== 'string') {
      return false;
    }
    return /^[0-9a-zA-Z\s]*$/.test(tokenName);
  }

  /**
   * Check if uuid is valid or not
   *
   * @param {String} uuid: UUID of user, branded token etc.
   *
   * @returns {Boolean}
   */
  static isUuidValid(uuid) {
    if (typeof uuid !== 'string') {
      return false;
    }

    return /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$/.test(uuid);
  }
}

module.exports = CommonValidator;
