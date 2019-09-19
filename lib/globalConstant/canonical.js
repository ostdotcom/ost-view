const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

class Canonical {
  constructor() {}

  get forHome() {
    if (coreConstants.IS_VIEW_SUB_ENVIRONMENT_MAIN) {
      return coreConstants.DOMAIN;
    } else {
      return coreConstants.DOMAIN + '/' + coreConstants.TESTNET_BASE_URL_PREFIX;
    }
  }

  get forAbout() {
    return coreConstants.DOMAIN + '/' + 'about';
  }
}

module.exports = new Canonical();
