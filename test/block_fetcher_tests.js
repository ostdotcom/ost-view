"use strict";
/**
 * Block fetcher tests
 */
const expect = require('chai').expect
  , assert = require('chai').assert
  ;


const rootPrefix = '..'
  , BlockFetcher = require(rootPrefix + '/lib/block_utils/block_fetcher')
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , DbInteract = require(rootPrefix + "/lib/storage/interact")
  ;

const testChainId = 101
  ;


describe('Create BlockFetcher object', function () {
  it('Object should get created', function () {

    const blockFetcher = BlockFetcher.newInstance(testChainId);

    expect(blockFetcher.constructor.name).to.be.equal('BlockFetcher');

    expect(blockFetcher.web3Interact.constructor.name).to.be.equal('Object');

    expect(blockFetcher.dbInteract.constructor.name).to.be.equal('Object');

    expect(blockFetcher.chainId).to.be.equal(testChainId);

    expect(blockFetcher.singleFetchForVerifier).to.be.equal(false);

    expect(blockFetcher.state).instanceOf(Object);

  });
});

describe('Check block insertion for empty Array', function () {
  it('block should not get inserted into db', function () {

    const blockFetcher = BlockFetcher.newInstance(testChainId);

    var blockArray = [];

    blockFetcher.writeBlocksToDB(blockArray)
      .then(function(response){
        assert.typeOf(response, 'array');
        assert.lengthOf(response, 0);
      });

  });
});
describe('Check block insertion for dataArray in db', function () {
  it('dataArray should get inserted into db', function () {

    const blockFetcher = BlockFetcher.newInstance(testChainId);
    const dbInteract = DbInteract.getInstance(testChainId);

    const blockArray = [[126497, '0x9dfa5b179a855c92b1f013c17105e886e43af65f1e0cde6f5f0bdfbd53500412',
      '0x3a3da9228ba74bd3a4bc416d6c100649dcd8eecc1133e24dd2a5bab572a7f717', '0x0000000000000000000000000000000000000000',
      '2', '252786', 100000000, 159949, 2, 1521291155,
      false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL]];


    blockFetcher.writeBlocksToDB(blockArray)
      .then(function(resArray){
        // dbInteract.
      });

  });
});