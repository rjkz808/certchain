const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { latestTime } = require('openzeppelin-solidity/test/helpers/latestTime');
const { parseNumber, parseString } = require('./helpers/bignumberUtils');
const { sendTransaction } = require('openzeppelin-solidity/test/helpers/sendTransaction');

const CertChain = artifacts.require('CertChain');

contract('CertChain', function(accounts) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const creator = accounts[0];

  let chain;

  beforeEach('create a new chain contract instance', async function() {
    this.chain = await CertChain.new({ from: creator });
  });

  describe('getCert methods', function() {
    let applicationDate;
    let firstAuditDate;
    let secondAuditDate;

    beforeEach('create new certificate', async function() {
      await this.chain.apply('standard', 'agency', 10, accounts[2], { from: accounts[1] });
      this.applicationDate = await latestTime();
      await this.chain.uploadQMS(1, 'QMS', { from: accounts[1] });
    });

    describe('getCertData', function() {
      context('when successfull', function() {
        it('gets the cerfificate application date', async function() {
          assert.equal(parseNumber((await this.chain.getCertData(1))[0]), this.applicationDate);
        });

        it('gets the certificate cost', async function() {
          assert.equal(parseNumber((await this.chain.getCertData(1))[1]), 10);
        });

        it('gets the certificate auditor address', async function() {
          assert.equal(parseString((await this.chain.getCertData(1))[2]), accounts[2]);
        });

        it('gets the certificate recepient company address', async function() {
          assert.equal(parseString((await this.chain.getCertData(1))[3]), accounts[1]);
        });

        it('gets the certificate standard', async function() {
          assert.equal(parseString((await this.chain.getCertData(1))[4]), 'standard');
        });

        it('gets the certificate agency', async function() {
          assert.equal(parseString((await this.chain.getCertData(1))[5]), 'agency');
        });

        it('gets the certificate QMS hash', async function() {
          assert.equal(
            parseString((await this.chain.getCertData(1))[6]),
            web3.sha3(web3.toHex('QMS'), { encoding: 'hex' })
          );
        });
      });

      context("when the specified certificate doesn't exist", function() {
        it('reverts', async function() {
          await assertRevert(this.chain.getCertData(2));
        });
      });
    });

    describe('getCertAudit', function() {
      beforeEach('audit', async function() {
        await this.chain.audit(1, 'first report', { from: accounts[2] });
        this.firstAuditDate = await latestTime();
        await this.chain.audit(1, 'second report', { from: accounts[2] });
        this.secondAuditDate = await latestTime();
      });

      context('when successfull', function() {
        it('gets the cerfificate first audit date', async function() {
          assert.equal(parseNumber((await this.chain.getCertAudit(1))[0]), this.firstAuditDate);
        });

        it('gets the certificate first audit report', async function() {
          assert.equal(
            parseString((await this.chain.getCertAudit(1))[1]),
            web3.sha3(web3.toHex('first report'), { encoding: 'hex' })
          );
        });

        it('gets the cerfificate second audit date', async function() {
          assert.equal(parseNumber((await this.chain.getCertAudit(1))[2]), this.secondAuditDate);
        });

        it('gets the certificate second audit report', async function() {
          assert.equal(
            parseString((await this.chain.getCertAudit(1))[3]),
            web3.sha3(web3.toHex('second report'), { encoding: 'hex' })
          );
        });
      });
    });
  });

  describe('apply', function() {
    context('when successfull', function() {
      let applicationDate;
      let logs;

      beforeEach('apply', async function() {
        const result = await this.chain.apply('standard', 'agency', 10, accounts[2], {
          from: accounts[1]
        });
        this.applicationDate = await latestTime();
        this.logs = result.logs;
      });

      context('mints the token', function() {
        it('increases the total tokens amount', async function() {
          assert.equal(parseNumber(await this.chain.totalSupply()), 1);
        });

        it('adds the token to the allTokens array', async function() {
          assert.equal(parseNumber(await this.chain.tokenByIndex(0)), 1);
        });

        it('increases the contract owner balance', async function() {
          assert.equal(parseNumber(await this.chain.balanceOf(creator)), 1);
        });

        it('sets the token owner to the contract owner address', async function() {
          assert.equal(parseString(await this.chain.ownerOf(1)), creator);
        });

        it('adds token to the contract owner ownedTokens array', async function() {
          assert.equal(parseNumber(await this.chain.tokenOfOwnerByIndex(creator, 0)), 1);
        });

        it('sets the token URI', async function() {
          assert.equal(parseString(await this.chain.tokenURI(1)), '');
        });

        it('emits a Transfer event', async function() {
          assert.equal(this.logs.length, 2);
          assert.equal(this.logs[0].event, 'Transfer');
          assert.equal(this.logs[0].args._from, ZERO_ADDRESS);
          assert.equal(this.logs[0].args._to, creator);
          assert.equal(parseNumber(this.logs[0].args._tokenId), 1);
        });
      });

      context('sets the token certificate properties', function() {
        it('sets the certificate application date', async function() {
          assert.equal(parseNumber((await this.chain.getCertData(1))[0]), this.applicationDate);
        });

        it('sets the certificate cost', async function() {
          assert.equal(parseNumber((await this.chain.getCertData(1))[1]), 10);
        });

        it('sets the certificate auditor address', async function() {
          assert.equal(parseString((await this.chain.getCertData(1))[2]), accounts[2]);
        });

        it('sets the certificate recepient company address', async function() {
          assert.equal(parseString((await this.chain.getCertData(1))[3]), accounts[1]);
        });

        it('sets the certificate standard', async function() {
          assert.equal(parseString((await this.chain.getCertData(1))[4]), 'standard');
        });

        it('sets the certificate agency', async function() {
          assert.equal(parseString((await this.chain.getCertData(1))[5]), 'agency');
        });

        it('emits an Apply event', async function() {
          assert.equal(this.logs.length, 2);
          assert.equal(this.logs[1].event, 'Apply');
          assert.equal(this.logs[1].args.company, accounts[1]);
          assert.equal(this.logs[1].args.auditor, accounts[2]);
          assert.equal(parseNumber(this.logs[1].args.certId), 1);
        });
      });
    });

    context('when the specified certificate cost equal or smaller than 0', function() {
      it('reverts', async function() {
        await assertRevert(
          this.chain.apply('standard', 'agency', 0, accounts[2], {
            from: accounts[1]
          })
        );
      });
    });

    context('when zero address specified as a certificate auditor', function() {
      it('reverts', async function() {
        await assertRevert(
          this.chain.apply('standard', 'agency', 10, ZERO_ADDRESS, {
            from: accounts[1]
          })
        );
      });
    });

    context('when the msg.sender specified as a certificate auditor', function() {
      it('reverts', async function() {
        await assertRevert(
          this.chain.apply('standard', 'agency', 10, accounts[1], {
            from: accounts[1]
          })
        );
      });
    });

    context('when the msg.sender is a contract owner', function() {
      it('reverts', async function() {
        await assertRevert(
          this.chain.apply('standard', 'agency', 10, accounts[2], {
            from: creator
          })
        );
      });
    });
  });
});
