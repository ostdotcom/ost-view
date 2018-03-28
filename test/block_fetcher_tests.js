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
  , BlockKlass = require(rootPrefix + "/app/models/block")
  ;

const testChainId = 101

  , blockData1 = {
    difficulty: 2,
    extraData: "0xd783010702846765746887676f312e382e33856c696e757800000000000000006dbcbf24a53322f9b2fe4327e712267e1064ce56424ee31785d389883cd37520673a810470d80bf6c5888397d23bb895660b16869609cc8d71fff362654f984701",
    gasLimit: 10000000,
    gasUsed: 0,
    hash: "0x15ac92d33a72e333b86246a5ab99efb94700293557c76d70ad770992a26032c7",
    logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    miner: "0x0000000000000000000000000000000000000000",
    mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    nonce: "0x0000000000000000",
    number: 1,
    parentHash: "0x56b364107fb505ae2a38bee9a2016ed01788cb45d99591d6827746657bcffdd0",
    receiptsRoot: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    size: 606,
    stateRoot: "0x499ae1f5e70f5d0931262e2b1b228149b7f0a06a309f9fff8d9f4d4996220851",
    timestamp: 1521038152,
    totalDifficulty: 3,
    transactions: [],
    transactionsRoot: "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    uncles: []
  }

  , blockData2 = {
    difficulty: 2,
    extraData: "0xd783010702846765746887676f312e382e33856c696e75780000000000000000c83d95d033fba7a9945eb40740353a8e18ebd7b3768645209a99c56869a72e3935d036d3a0a45d20e650f0ceee3fbb7eb764fcb74ec68faf26c582b946def5ef01",
    gasLimit: 100000000,
    gasUsed: 766004,
    hash: "0x2c4978b579c0e583c19709be5d6f4169a3deb577731d38020529a7a6194f13a0",
    logsBloom: "0x000000008000000000100000000000000000001000000008000400010010000000040020011000000004000100000000110020880000080400000040000000000040e001002000000000000800008000000000000000001000000010000080000004000000010000020000041000000000000004000080400000001300000000800100001000000800000048000000000820001000000080008000200300300820004000000408400202201010040100000001020000000000000180400008400000400208204004000000000001110082000004040000400a1000000000000800000004000001000204140000000100400000090000004080200080200c0400",
    miner: "0x0000000000000000000000000000000000000000",
    mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    nonce: "0x0000000000000000",
    number: 91000,
    parentHash: "0x78262070a2004c616563a5f46bea0caee4e2f6c4b384d7a1846dd31e092d2392",
    receiptsRoot: "0xfe8c0a3a1c4bc72b6eb8e40b8c016647c8905cdf351dd737e0071c93e05323b8",
    sha3Uncles: "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    size: 4025,
    stateRoot: "0x30e183db240dd18f989d51589dc1b25b3a1200a0f630f6cc4a6a46b50e90a892",
    timestamp: 1521220161,
    totalDifficulty: 181792,
    transactions: ["0x80074c69a9c44d56ffc059e4698349c5cd686b1cb326705d998400ae79977780", "0xe0e21b55c16caaf76f1661b916362a8f6a6e10eff9a217ee59ec28bfef4a1531", "0x416dd890b9c3f72e223fbf41d1f8a28738c42e603788fdfac8d535f23a2cd4f1", "0x6e78efac0f83b49429520fa91047c96d99a0506f6c16ac9c20ec448e077045b4", "0x56ec96f9fb4f13905ae5b6073066e82249da169629d220cc2a55e5a1a90a6964", "0xb89e3699a7a55cab15b295066741398f9a7c008e7ed48db3d30b1531011dcc1d", "0xe5f7e9d22cbcf6d59208f7c72d4cf9438baa77fa4aa0978bd91485353672fb4c", "0xc37a25052afea9a7730fda52fb22edc452a723e2ab682bd301252617b0ce40f2", "0xca7b840c7dafd8e9d6ead6d66d3c6af382fde1d8364cfe832a733a50d7f5ab4a", "0x9944fb96e68a7b3ca6718cf55dc9c4310b699f12b358bb1e0fa47a3b38e30d90"],
    transactionsRoot: "0xb04a0079c7c5b21fda55211b5d5b8733b262e8c90f5e1c3bffc925473c1504d7",
    uncles: []
  }
  , webRpcObject = {
    getReceipt: function(txn){
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
    getTransaction: function(txn) {
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
    }
  }
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

    const blockArray = [];

    blockFetcher.writeBlocksToDB(blockArray)
      .then(function(response){
        assert.typeOf(response, 'array');
        assert.lengthOf(response, 0);
      });

  });
});

describe('Check block insertion for dataArray in db', function () {
  it('dataArray should get inserted into db', async function () {

    const blockFetcher = BlockFetcher.newInstance(testChainId)
      ;

    // DB clean up
    await new BlockKlass(testChainId).delete().where('1=1').fire();

    const blockArray = [blockData1, blockData2];

    console.log(blockData1.transactions, blockData2.transactions);

    const result = await blockFetcher.writeBlocksToDB(blockArray)
      .then(function(resArray){
        assert.typeOf(resArray, 'array');
        assert.lengthOf(resArray, 2);

        return new BlockKlass(testChainId).select('COUNT(id)').fire();
      })
      .then(function(res){
        return res[0]['COUNT(id)'];
      })
      .catch(function(err){
        assert.fail(0, 1, err);
      });

    expect(result).to.be.equal('2');
  });
});

// describe('Check transaction insertion for dataArray in db', function () {
//   it('dataArray should get inserted into db', async function () {
//
//     const blockFetcher = BlockFetcher.newInstance(testChainId)
//     ;
//
//     Web3Interact.setInstance(testChainId, webRpcObject);
//     console.log(Object.keys(webRpcObject));
//     // DB clean up
//     await new BlockKlass(testChainId).delete().where('1=1').fire();
//
//     const blockArray = [blockData1, blockData2];
//
//     console.log(blockData1.transactions, blockData2.transactions);
//
//     const result = await blockFetcher.writeBlocksToDB(blockArray)
//       .then(function(resArray){
//         assert.typeOf(resArray, 'array');
//         assert.lengthOf(resArray, 2);
//
//         return new BlockKlass(testChainId).select('COUNT(id)').fire();
//       })
//       .then(function(res){
//         return res[0]['COUNT(id)'];
//       })
//       .catch(function(err){
//         assert.fail(0, 1, err);
//       });
//
//     expect(result).to.be.equal('2');
//   });
// });