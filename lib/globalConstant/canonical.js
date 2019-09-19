const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

class Canonical {
  constructor() {}

  forHome() {
    if (coreConstants.IS_VIEW_SUB_ENVIRONMENT_MAIN) {
      return coreConstants.DOMAIN;
    } else {
      return coreConstants.DOMAIN + '/' + coreConstants.TESTNET_BASE_URL_PREFIX;
    }
  }

  forAbout() {
    return coreConstants.DOMAIN + '/' + 'about';
  }

  forEconomy(tokenSymbol) {
    return coreConstants.DOMAIN + '/' + coreConstants.BASE_URL_PREFIX + '/' + tokenSymbol;
  }
}

module.exports = new Canonical();
