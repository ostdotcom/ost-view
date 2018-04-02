"use strict";
/**
 * Transaction Processor tests
 */
const expect = require('chai').expect
  , assert = require('chai').assert
;


const rootPrefix = '..'
  , BlockFetcher = require(rootPrefix + '/lib/block_utils/block_fetcher')
  , Web3Interact = require(rootPrefix + "/lib/web3/interact/rpc_interact")
  , BlockKlass = require(rootPrefix + "/app/models/block")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , TransactionKlass = require(rootPrefix + "/app/models/transaction")
  , TransactionHashKlass = require(rootPrefix + "/app/models/transaction_hash")
  , AddressKlass = require(rootPrefix + "/app/models/address")
  , TransactionProcessor = require(rootPrefix + "/lib/block_utils/transaction_processor")
;

const testChainId = 101
  ,webRpcObject = {
    getReceipt: function (txn) {
      return Promise.resolve({
        blockHash: "0x2c4978b579c0e583c19709be5d6f4169a3deb577731d38020529a7a6194f13a0",
        blockNumber: 91000,
        contractAddress: null,
        cumulativeGasUsed: 82768,
        from: "0xe4ec5a29c98c57b692c6b3b81397b5e2944336b1",
        gasUsed: 82768,
        logs: [{
          address: "0x0ca74d9f4bb9d17257af5b5e26bdfc931715262d",
          blockHash: "0x2c4978b579c0e583c19709be5d6f4169a3deb577731d38020529a7a6194f13a0",
          blockNumber: 91000,
          data: "0x0000000000000000000000000000000000000000000000181f474c449ad04e28",
          logIndex: 0,
          removed: false,
          topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", "0x0000000000000000000000000a52181b8f8f09981826de27c7d6f73001bfacfc", "0x000000000000000000000000230708876f3b76a9fabac2e59ad7499b9cf9e959"],
          transactionHash: "0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780",
          transactionIndex: 0
        }, {
          address: "0x0ca74d9f4bb9d17257af5b5e26bdfc931715262d",
          blockHash: "0x2c4978b579c0e583c19709be5d6f4169a3deb577731d38020529a7a6194f13a0",
          blockNumber: 91000,
          data: "0x0000000000000000000000000000000000000000000000000000000000000000",
          logIndex: 1,
          removed: false,
          topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", "0x0000000000000000000000000a52181b8f8f09981826de27c7d6f73001bfacfc", "0x000000000000000000000000c42134e9b7ca409ef542ab29bd45fa3e85a0b261"],
          transactionHash: "0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780",
          transactionIndex: 0
        }, {
          address: "0x68ac52983ae362deab036817e369b9a60a073ecb",
          blockHash: "0x2c4978b579c0e583c19709be5d6f4169a3deb577731d38020529a7a6194f13a0",
          blockNumber: 91000,
          data: "0x0000000000000000000000000000000000000000000000181f474c449ad04e2800000000000000000000000000000000000000000000000000000000000000005553440000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000028c60b16ed0c0000000000000000000000000000000000000000000000000000000000000000000",
          logIndex: 2,
          removed: false,
          topics: ["0x12889b9f6a87492224e4fd8e6dbdb4618b3f564708185c493b152215ee961f5d", "0x000000000000000000000000230708876f3b76a9fabac2e59ad7499b9cf9e959", "0x000000000000000000000000c42134e9b7ca409ef542ab29bd45fa3e85a0b261", "0x0000000000000000000000000a52181b8f8f09981826de27c7d6f73001bfacfc"],
          transactionHash: "0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780",
          transactionIndex: 0
        }],
        logsBloom: "0x00000000000000000000000000000000000000000000000800000000000000000000000001000000000400000000000010000000000000000000000000000000000020000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000012000000008000000000000000000000080000000000000000000000800000000000000000000000000000080000000000100000000000000000000000000000004000000000004002000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000008020008000000000",
        status: "0x1",
        to: "0x68ac52983ae362deab036817e369b9a60a073ecb",
        transactionHash: txn,
        transactionIndex: 0
      });
    },
    getTransaction: function (txn) {
      return Promise.resolve({
        blockHash: "0x2c4978b579c0e583c19709be5d6f4169a3deb577731d38020529a7a6194f13a0",
        blockNumber: 91000,
        from: "0xe4ec5a29c98c57b692c6b3b81397b5e2944336b1",
        gas: 150000,
        gasPrice: 1000000000,
        hash: txn,
        input: "0xae20a9ae000000000000000000000000230708876f3b76a9fabac2e59ad7499b9cf9e9590000000000000000000000000000000000000000000000004563918244f40000000000000000000000000000c42134e9b7ca409ef542ab29bd45fa3e85a0b261000000000000000000000000000000000000000000000000000000000000000055534400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000284a115cc8f70000000000000000000000000000a52181b8f8f09981826de27c7d6f73001bfacfc0000000000000000000000000000000000000000000000000000000000000000",
        nonce: 27984,
        r: "0x7eb8d25b5c928c407fcc0203c0126309ce65153a9e2e5b5d1d7419b0ffa91a11",
        s: "0x64dc6528bed108856a18a4616f8621703de81f09f4a2a42813ee06f8ab0b31d0",
        to: "0x68ac52983ae362deab036817e369b9a60a073ecb",
        transactionIndex: 0,
        v: "0x1c",
        value: 0
      });
    },
    isNodeConnected: function () {
      return Promise.resolve();
    }
  }
;


describe('Create TransactionProcessor Object', function () {
  it('TransactionProcessor.newInstance', function () {

    TransactionProcessor.setInstance(null);
    const transactionProcessor = TransactionProcessor.newInstance(testChainId);

    expect(transactionProcessor.constructor.name).to.be.equal('TransactionProcessor');

    expect(transactionProcessor.chainId).to.be.equal(testChainId);
  });
});

describe('Check transaction insertion for empty Array', function () {
  it('Transaction should not get inserted into db', async function () {

    TransactionProcessor.setInstance(null);
    const transactionProcessor = TransactionProcessor.newInstance(testChainId);

    const transactionArray = [];

    let isProcessed = await transactionProcessor.writeTransactionsToDB(transactionArray);

    expect(isProcessed, "Is Not processed successfully for empty txn array").to.be.equal(true);

  });
});

describe('Combine transaction and receipt from web3 interact', function () {
  it('createTransactionWithReceiptPromise', async function () {

    Web3Interact.setInstance(testChainId, webRpcObject);

    TransactionProcessor.setInstance(null);
    const transactionProcessor = TransactionProcessor.newInstance(testChainId);

    const result = await transactionProcessor.createTransactionWithReceiptPromise({hash:'0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780', timestamp:1521038152});

    expect(result.constructor.name).to.be.equal('Object');
  });
});

describe('Process transaction with from web3 interact', function () {
  it('processTransactionsWithIds', async function () {

    Web3Interact.setInstance(testChainId, webRpcObject);

    // DB clean up
    await new AddressKlass(testChainId).delete().where('1=1').fire();
    await new TransactionHashKlass(testChainId).delete().where('1=1').fire();
    await new TransactionKlass(testChainId).delete().where('1=1').fire();

    TransactionProcessor.setInstance(null);
    const transactionProcessor = TransactionProcessor.newInstance(testChainId)
      , transaction = await webRpcObject.getReceipt('0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780')
      , receipt = await webRpcObject.getTransaction('0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780')
      , transactionArray = Object.assign({timestamp: 1521220161},transaction, receipt)
    ;

    console.log(transactionArray);
    const result = await transactionProcessor.processTransactionsWithIds([transactionArray]);

    console.log(result);
    expect(result, "Not an Object of data").to.be.an('Object');
    expect(result.formattedTxnArray, "Not have an array of data formattedTxnArray").to.be.an('array');
    expect(result.formattedExtendedTxnArray, "Not have an array of data formattedExtendedTxnArray").to.be.an('array');
    expect(result.formattedAddrTxnArray, "Not have an array of data formattedAddrTxnArray").to.be.an('array');
  });
});

