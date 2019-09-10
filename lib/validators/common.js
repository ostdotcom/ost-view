/**
 * Module for common validators.
 *
 * @module lib/validators/common
 */

/**
 * Class for common validators.
 *
 * @class CommonValidator
 */
class CommonValidator {
  /**
   * Is var null?
   *
   * @return {boolean}
   */
  static isVarNull(variable) {
    return typeof variable === 'undefined' || variable == null;
  }

  /**
   * Is var true?
   *
   * @return {boolean}
   */
  static isVarTrue(variable) {
    return variable === true || variable === 'true';
  }

  /**
   * Is var false?
   *
   * @return {boolean}
   */
  static isVarFalse(variable) {
    return variable === false || variable === 'false';
  }

  /**
   * Is var integer?
   *
   * @return {boolean}
   */
  static isVarInteger(variable) {
    if (typeof variable === 'number') {
      return variable % 1 === 0;
    }
    const number = Number(variable);
    if (isNaN(number)) {
      return false;
    }

    return CommonValidator.isVarInteger(number);
  }

  /**
   * Checks if the given string is an address.
   *
   * @param {string} address: HEX address
   *
   * @return {boolean}
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
   * Check if transaction hash is valid or not.
   *
   * @param {string} transactionHash
   *
   * @return {boolean}
   */
  static isTxHashValid(transactionHash) {
    if (typeof transactionHash !== 'string') {
      return false;
    }

    return /^0x[0-9a-fA-F]{64}$/.test(transactionHash);
  }

  /**
   * Check if token name is valid or not.
   *
   * @param {string} tokenName: Token name
   *
   * @return {boolean}
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
   * @param {string} uuid: UUID of user, branded token etc.
   *
   * @returns {boolean}
   */
  static isUuidValid(uuid) {
    if (typeof uuid !== 'string') {
      return false;
    }

    return /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$/.test(uuid);
  }
}

module.exports = CommonValidator;
