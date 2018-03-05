"use strict";

/*
 * JWT implementation
 *
 * * Author: Kedar
 * * Date: 25/01/2018
 * * Reviewed by:
 */

const jwt = require('jsonwebtoken')
;

const rootPrefix = '../..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

const jwtAuth = {

  // Issue new token
  issueToken: function (data, keyType) {
    const payload = {"data": data}
      , jwtOptions = {"expiresIn": 60 * 5};
    return jwt.sign(payload, jwtAuth.getKeyFor(keyType), jwtOptions);
  },

  // Verify token
  verifyToken: function (token, keyType) {

    console.log("coreConstants.JWT_API_SECRET_KEY :: ",coreConstants.JWT_API_SECRET_KEY);
    console.log("token :: ", token);
    console.log("keyType :: ",keyType);

    return new Promise(function (onResolve, onReject) {
      var jwtCB = function (err, decodedToken) {
        if (err) {
          onReject(err);
        } else {
          onResolve(decodedToken);
        }
      };

      jwt.verify(token, jwtAuth.getKeyFor(keyType), {}, jwtCB);
    });
  },

  getKeyFor: function (keyType) {
    return (keyType == 'saasApi' ? coreConstants.JWT_API_SECRET_KEY : '');
  }
};

module.exports = jwtAuth;