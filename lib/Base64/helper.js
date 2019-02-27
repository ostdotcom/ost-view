'use strict';

/**
 * This class is used to encode and decode data in Base64 format.
 * @type {string}
 */

const rootPrefix = '../../..';

class Base64Helper {
  constructor() {}

  /**
   *
   * @param data
   * @returns {string}
   */
  encode(data) {
    let buff = new Buffer.from(data),
      base64data = buff.toString('base64');

    return base64data;
  }

  /**
   *
   * @param base64data
   * @returns {string}
   */
  decode(base64data) {
    let buff = new Buffer(base64data, 'base64'),
      data = buff.toString('ascii');

    return data;
  }
}

module.exports = new Base64Helper();
