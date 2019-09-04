const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  jwtAuth = require(rootPrefix + '/lib/jwt/jwt_auth');

class Jwt {
  constructor() {}

  static authenticate(req, res, next) {
    let token;

    if (req.method === 'POST' || req.method === 'DELETE') {
      token = req.body.token || '';
    } else if (req.method === 'GET') {
      token = req.query.token || '';
    }

    // Set the decoded params in the re and call the next in control flow.
    const jwtOnResolve = function(reqParams) {
      req.params = reqParams.data;
      // Validation passed.
      return next();
    };

    // send error, if token is invalid
    const jwtOnReject = function(err) {
      return responseHelper.error('401', 'invalid_or_expired_jwt_token').renderResponse(res, 401);
    };

    // Verify token
    Promise.resolve(jwtAuth.decrypt(token).then(jwtOnResolve, jwtOnReject)).catch(function(err) {
      return responseHelper.error('500', 'something_went_wrong').renderResponse(res, 500);
    });
  }
}

module.exports = Jwt;
