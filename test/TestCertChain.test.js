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
          assert.equal(this.logs.length, 1);
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

  describe('uploadQMS', function() {
    beforeEach('apply', async function() {
      await this.chain.apply('standard', 'agency', 10, accounts[2], {
        from: accounts[1]
      });
    });

    context('when successfull', function() {
      let logs;

      beforeEach('uploadQMS', async function() {
        const result = await this.chain.uploadQMS(1, 'QMS', { from: accounts[1] });
        this.logs = result.logs;
      });

      it('sets the specified certificate QMS hash', async function() {
        assert.equal(
          parseString((await this.chain.getCertData(1))[6]),
          web3.sha3(web3.toHex('QMS'), { encoding: 'hex' })
        );
      });
    });

    context("when the msg.sender isn't customer company of the specified certificate", function() {
      it('reverts', async function() {
        await assertRevert(this.chain.uploadQMS(1, 'QMS', { from: accounts[2] }));
      });
    });

    context("when the contract owner doesn't own the specified certificate", function() {
      it('reverts', async function() {
        await this.chain.transferFrom(creator, accounts[1], 1, { from: creator });
        await assertRevert(this.chain.uploadQMS(1, 'QMS', { from: accounts[1] }));
      });
    });
  });

  describe('audit', function() {
    let time;
    let logs;

    beforeEach('apply', async function() {
      await this.chain.apply('standard', 'agency', 10, accounts[2], {
        from: accounts[1]
      });
      await this.chain.uploadQMS(1, 'QMS', { from: accounts[1] });
    });

    context('when the audit function is called the first time', function() {
      beforeEach('audit', async function() {
        const result = await this.chain.audit(1, 'first audit report', { from: accounts[2] });
        this.time = await latestTime();
        this.logs = result.logs;
      });

      it('sets the first audit date', async function() {
        assert.equal(parseNumber((await this.chain.getCertAudit(1))[0]), this.time);
      });

      it('sets first audit report', async function() {
        assert.equal(
          parseString((await this.chain.getCertAudit(1))[1]),
          web3.sha3(web3.toHex('first audit report'), { encoding: 'hex' })
        );
      });
    });

    context('when the audit function is called the second time', function() {
      beforeEach('audit', async function() {
        await this.chain.audit(1, 'first audit report', { from: accounts[2] });
        const result = await this.chain.audit(1, 'second audit report', { from: accounts[2] });
        this.time = await latestTime();
        this.logs = result.logs;
      });

      it('sets the second audit date', async function() {
        assert.equal(parseNumber((await this.chain.getCertAudit(1))[2]), this.time);
      });

      it('sets second audit report', async function() {
        assert.equal(
          parseString((await this.chain.getCertAudit(1))[3]),
          web3.sha3(web3.toHex('second audit report'), { encoding: 'hex' })
        );
      });
    });

    context('when the audit function is called 3 or more times', function() {
      it('reverts', async function() {
        await this.chain.audit(1, 'first audit report', { from: accounts[2] });
        await this.chain.audit(1, 'second audit report', { from: accounts[2] });
        await assertRevert(this.chain.audit(1, 'third audit report', { from: accounts[2] }));
      });
    });

    context("when the msg.sender isn't auditor of the specified certificate", function() {
      it('reverts', async function() {

        await assertRevert(this.chain.audit(1, 'first audit report', { from: accounts[1] }));
      });
    });

    context("when the contract owner doesn't own the specified token", function() {
      it('reverts', async function() {
        await this.chain.transferFrom(creator, accounts[1], 1, { from: creator });
        await assertRevert(this.chain.audit(1, 'first audit report', { from: accounts[2] }));
      });
    });

    context('when the customer company hasn\'t uploaded the QMS documents yet', function() {
      it('reverts', async function() {
        await this.chain.apply('standard', 'agency', 10, accounts[2], {
          from: accounts[1]
        });
        await assertRevert(this.chain.audit(2, 'first audit report', { from: accounts[2] }));
      });
    });
  });
});
