"use strict";
/**
 * Block fetcher tests
 */
const expect = require('chai').expect
  , assert = require('chai').assert
;


const rootPrefix = '..'
  , GraphDataKlass = require(rootPrefix + '/app/models/graph_data')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , GraphDataBuilder = require(rootPrefix + '/lib/block_utils/graph_data_builder')
;

const testChainId = 101
;


describe('Graph Data Builder process hourly time frame', function () {
  it('processHourTimeFrame', function () {

    const blockFetcher = GraphDataBuilder.newInstance(testChainId);

    expect(blockFetcher.constructor.name).to.be.equal('BlockFetcher');

    expect(blockFetcher.web3Interact.constructor.name).to.be.equal('Object');

    expect(blockFetcher.chainId).to.be.equal(testChainId);

    expect(blockFetcher.singleFetchForVerifier).to.be.equal(false);

    expect(blockFetcher.state).instanceOf(Object);

  });
});