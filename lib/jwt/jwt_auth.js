'use strict';

/*
 * JWT implementation
 *
 * * Author: Kedar
 * * Date: 25/01/2018
 * * Reviewed by:
 */

const jwt = require('jsonwebtoken');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const key = coreConstants.JWT_SECRET_KEY;

class JwtAuth {
  constructor() {}

  static encrypt(data) {
    const payload = { data: data },
      jwtOptions = { expiresIn: 60 * 5 };
    return jwt.sign(payload, key, jwtOptions);
  }

  static decrypt(token) {
    return new Promise(function(onResolve, onReject) {
      var jwtCB = function(err, decodedToken) {
        if (err) {
          onReject(err);
        } else {
          onResolve(decodedToken);
        }
      };

      jwt.verify(token, key, {}, jwtCB);
    });
  }
}

module.exports = JwtAuth;
