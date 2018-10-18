const { assertRevert } = require('openzeppelin-solidity/test/helpers/assertRevert');
const { parseNumber, parseString, parseJSON } = require('./helpers/bignumberUtils');
const { sendTransaction } = require('openzeppelin-solidity/test/helpers/sendTransaction');

const CertToken = artifacts.require('CertChain');

contract('CertToken', function(accounts) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const creator = accounts[0];

  let token;

  beforeEach('create a new token contract instance', async function() {
    this.token = await CertToken.new({ from: creator });
  });

  describe('initial', function() {
    it('sets the token name', async function() {
      assert.equal(parseString(await this.token.name()), 'CertChain');
    });

    it('sets the token symbol', async function() {
      assert.equal(parseString(await this.token.symbol()), 'CRT');
    });

    it('sets the token decimals', async function() {
      assert.equal(parseNumber(await this.token.decimals()), 0);
    });

    it("doesn't issue new tokens", async function() {
      assert.equal(parseNumber(await this.token.totalSupply()), 0);
    });
  });

  describe('balanceOf', function() {
    beforeEach('mint a token', async function() {
      await this.token.apply('', '', 1, accounts[1]);
    });

    context('when the specified address owns some tokens', function() {
      it('returns its owned tokens amount', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(creator)), 1);
      });
    });

    context("when the specified address doesn't own any tokens", function() {
      it('returns 0', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(accounts[1])), 0);
      });
    });

    context('when zero address specified', function() {
      it('reverts', async function() {
        await assertRevert(this.token.balanceOf(ZERO_ADDRESS));
      });
    });
  });
});
