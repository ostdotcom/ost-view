"use strict";
/**
 * Transaction Processor tests
 */
const expect = require('chai').expect
  , assert = require('chai').assert
;


const rootPrefix = '..'
  , TransactionHashKlass = require(rootPrefix + "/app/models/transaction_hash")
  , AddressKlass = require(rootPrefix + "/app/models/address")
  , AddressTransactionKlass = require(rootPrefix + "/app/models/address_transaction")
  , TokenTransferKlass = require(rootPrefix + "/app/models/token_transfer")
  , AddressTokenTransferKlass = require(rootPrefix + "/app/models/address_token_transfer")
  , TransactionLogProcessor = require(rootPrefix + "/lib/block_utils/transaction_log_processor")
  , BrandedTokenKlass = require(rootPrefix + "/app/models/branded_token")
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
        transactionIndex: 0,
        decodedLogs : { Transfer:
            [ { address: '0x0ca74d9f4bb9d17257af5b5e26bdfc931715262d',
              _from: '0x0a52181b8f8f09981826de27c7d6f73001bfacfc',
              _to: '0x230708876f3b76a9fabac2e59ad7499b9cf9e959',
              _value: '444975711765090291240' },
              { address: '0x0ca74d9f4bb9d17257af5b5e26bdfc931715262d',
                _from: '0x0a52181b8f8f09981826de27c7d6f73001bfacfc',
                _to: '0xc42134e9b7ca409ef542ab29bd45fa3e85a0b261',
                _value: '0' } ],
          AirdropPayment: [ { address: '0x68ac52983ae362deab036817e369b9a60a073ecb',
            _beneficiary: '0x230708876f3b76a9fabac2e59ad7499b9cf9e959',
            _tokenAmount: '444975711765090291240',
            _commissionBeneficiary: '0xc42134e9b7ca409ef542ab29bd45fa3e85a0b261',
            _commissionTokenAmount: '0',
            _currency: '0x555344',
            _actualPricePoint: '183628000000000000',
            _spender: '0x0a52181b8f8f09981826de27c7d6f73001bfacfc',
            _airdropUsed: '0' } ] }
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
  , ReceiptForRegisteration = {
    blockHash: "0x4ded379c4e3f988d4fe67d9f6df0a2dc3f19b580cce80b755ff505c7a63bde7c",
    blockNumber: 9224,
    contractAddress: null,
    cumulativeGasUsed: 140215,
    from: "0xbff42cb67dd74779a9a04c43f671cf8c233f24f9",
    gasUsed: 140215,
    logs: [{
      address: "0x01db94fdca0ffedc40a6965de97790085d71b412",
      blockHash: "0x4ded379c4e3f988d4fe67d9f6df0a2dc3f19b580cce80b755ff505c7a63bde7c",
      blockNumber: 9224,
      data: "0x0cc7b409328a1e932c3e5992437ce8e20b3b2a6d466d2745ca7d55e15d8f17a500000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000001a86460000000000000000000000000000000000000000000000000000000000000005000000000000000000000000c3e16142a0d26c6ae0b1ceb8d9a726e74e1da6df0000000000000000000000000000000000000000000000000000000000000003534b5400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008534b20546f6b656e000000000000000000000000000000000000000000000000",
      logIndex: 0,
      removed: false,
      topics: ["0xc574c1a072c0be7629faa73718f0775d084a6e2bf29f1e60fc4ac61666afbd84", "0x000000000000000000000000e0960efec96583a91d34c5f8ef4947b7b67ffb9b", "0x0000000000000000000000002d6eb046e7290970d34746ffe52b5edd517ecd0c"],
      transactionHash: "0xf1fbd2e03f4464dd14686d7071cf8068bd243a74dbb55869d02ffba2b6c7d515",
      transactionIndex: 0
    }],
    logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000010000000000000000000000000000000000000000000000000000000000000000000000000020000000100000004400040020000000010000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    status: "0x1",
    to: "0xe0960efec96583a91d34c5f8ef4947b7b67ffb9b",
    transactionHash: "0xf1fbd2e03f4464dd14686d7071cf8068bd243a74dbb55869d02ffba2b6c7d515",
    transactionIndex: 0
  }
  , transactionHashId = { '0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780': 115 }
  , addressHashId = { '0xe4ec5a29c98c57b692c6b3b81397b5e2944336b1': 243,
  '0x68ac52983ae362deab036817e369b9a60a073ecb': 244,
  '0x0ca74d9f4bb9d17257af5b5e26bdfc931715262d': 245,
  '0x230708876f3b76a9fabac2e59ad7499b9cf9e959': 246,
  '0x0a52181b8f8f09981826de27c7d6f73001bfacfc': 247,
  '0xc42134e9b7ca409ef542ab29bd45fa3e85a0b261': 248 }
;


describe('Create TransactionLogProcessor Object', function () {
  it('TransactionLogProcessor.newInstance', function () {

    TransactionLogProcessor.setInstance(null);
    const transactionLogProcessor = TransactionLogProcessor.newInstance(testChainId);

    expect(transactionLogProcessor.constructor.name).to.be.equal('TransactionLogProcessor');

    expect(transactionLogProcessor.chainId).to.be.equal(testChainId);
  });
});

describe('Process Transfers with ids', function () {
  it('processTransfersWithIds', async function () {

    // DB clean up
    await new AddressKlass(testChainId).delete().where('1=1').fire();
    await new TransactionHashKlass(testChainId).delete().where('1=1').fire();
    await new TokenTransferKlass(testChainId).delete().where('1=1').fire();
    await new AddressTokenTransferKlass(testChainId).delete().where('1=1').fire();

    TransactionLogProcessor.setInstance(null);
    const transactionLogProcessor = TransactionLogProcessor.newInstance(testChainId)
      , transaction = await webRpcObject.getReceipt('0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780')
      , receipt = await webRpcObject.getTransaction('0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780')
      , transactionArray = Object.assign({timestamp: 1521220161},transaction, receipt)
    ;

    const decodeTransactionArray = transactionLogProcessor.getLogsDecodedArray([transactionArray]);

    expect(decodeTransactionArray[0],"Does not have logs key").to.have.any.key('logs');
    expect(decodeTransactionArray[0].decodedLogs,"Does not have transfer key").to.have.any.key('Transfer');

    transactionLogProcessor.transactionHashId = transactionHashId;
    transactionLogProcessor.addressHashId = addressHashId;

    const result = await transactionLogProcessor.processTransfersWithIds(decodeTransactionArray);
    // console.log(result);
    expect(result, "Not an Object of data").to.be.an('Object');
    expect(result.formattedTransferArray, "Not have an array of data formattedTransferArray").to.be.an('array');
    expect(result.formattedAddrTransferArray, "Not have an array of data formattedAddrTransferArray").to.be.an('array');
  });
});

describe('Test insertion Of branded token insertion', function () {
  it('insertRegisteredBrandedTokens', async function () {

    // DB clean up
    await new AddressKlass(testChainId).delete().where('1=1').fire();
    await new TransactionHashKlass(testChainId).delete().where('1=1').fire();
    await new BrandedTokenKlass(testChainId).delete().where('1=1').fire();

    TransactionLogProcessor.setInstance(null);
    const transactionLogProcessor = TransactionLogProcessor.newInstance(testChainId)
      , transaction = await webRpcObject.getReceipt('0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780')
      , receipt = ReceiptForRegisteration
      , transactionArray = Object.assign({timestamp: 1521220161},transaction, receipt)
    ;

    const decodeTransactionArray = transactionLogProcessor.getLogsDecodedArray([transactionArray]);

    expect(decodeTransactionArray[0],"Does not have logs key").to.have.any.key('logs');
    expect(decodeTransactionArray[0].decodedLogs,"Does not have transfer key").to.have.any.key('RegisteredBrandedToken');

    const result = await transactionLogProcessor.insertRegisteredBrandedTokens(decodeTransactionArray);
    // console.log(result);
    expect(result, "Not an Object of data").to.be.equal(true);
  });
});

describe('Test complete transaction log processor', function () {
  it('process', async function () {

    // DB clean up
    await new AddressKlass(testChainId).delete().where('1=1').fire();
    await new TransactionHashKlass(testChainId).delete().where('1=1').fire();
    await new TokenTransferKlass(testChainId).delete().where('1=1').fire();
    await new AddressTokenTransferKlass(testChainId).delete().where('1=1').fire();

    TransactionLogProcessor.setInstance(null);
    const transactionLogProcessor = TransactionLogProcessor.newInstance(testChainId)
      , transaction = await webRpcObject.getReceipt('0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780')
      , receipt = await webRpcObject.getTransaction('0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780')
      , transactionArray = Object.assign({timestamp: 1521220161},transaction, receipt)
    ;
    // console.log(transactionArray)
    const result = await transactionLogProcessor.process([transactionArray], transactionHashId, addressHashId);
    // console.log(result);
    expect(result, "Not an Object of data").to.be.equal(true);

  });
});

