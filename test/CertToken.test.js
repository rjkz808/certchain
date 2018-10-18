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

    it('registers the ERC165 inteface ID', async function() {
      assert.equal(await this.token.supportsInterface('0x01ffc9a7'), true);
    });

    it('registers the ERC721 inteface ID', async function() {
      assert.equal(await this.token.supportsInterface('0x80ac58cd'), true);
    });

    it('registers the ERC721Exists inteface ID', async function() {
      assert.equal(await this.token.supportsInterface('0x4f558e79'), true);
    });

    it('registers the ERC721Enumerable inteface ID', async function() {
      assert.equal(await this.token.supportsInterface('0x780e9d63'), true);
    });

    it('registers the ERC721Metadata inteface ID', async function() {
      assert.equal(await this.token.supportsInterface('0x5b5e139f'), true);
    });

    it("doesn't issue new tokens", async function() {
      assert.equal(parseNumber(await this.token.totalSupply()), 0);
    });
  });

  describe('balanceOf', function() {
    beforeEach('mint a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
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

  describe('ownerOf', function() {
    beforeEach('mint a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
    });

    context('when successfull', function() {
      it('returns its owner address', async function() {
        assert.equal(parseString(await this.token.ownerOf(1)), creator);
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.ownerOf(2));
      });
    });
  });

  describe('exists', function() {
    beforeEach('mint a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
    });

    context('when the specified token exists', function() {
      it('returns true', async function() {
        assert.equal(await this.token.exists(1), true);
      });
    });

    context("when the specified token doesn't exist", function() {
      it('returns', async function() {
        assert.equal(await this.token.exists(2), false);
      });
    });
  });

  describe('getApproved', function() {
    beforeEach('mint and approve a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
      await this.token.approve(accounts[1], 1, { from: creator });
    });

    context('when the specified token exists', function() {
      it('returns its owner address', async function() {
        assert.equal(parseString(await this.token.getApproved(1)), accounts[1]);
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.getApproved(2));
      });
    });
  });

  describe('isApprovedForAll', function() {
    beforeEach('set an operator approval', async function() {
      await this.token.setApprovalForAll(accounts[1], true, { from: accounts[0] });
    });

    context('when the specified operator approval exists', function() {
      it('returns true', async function() {
        assert.equal(await this.token.isApprovedForAll(accounts[0], accounts[1]), true);
      });
    });

    context("when the specified operator approval doesn't exist", function() {
      it('returns false', async function() {
        assert.equal(await this.token.isApprovedForAll(accounts[1], accounts[0]), false);
      });
    });

    context('when zero address specified as an approval owner', function() {
      it('reverts', async function() {
        await assertRevert(this.token.isApprovedForAll(ZERO_ADDRESS, accounts[1]));
      });
    });

    context('when zero address specified as an approval spender', function() {
      it('reverts', async function() {
        await assertRevert(this.token.isApprovedForAll(accounts[0], ZERO_ADDRESS));
      });
    });
  });

  describe('isApprovedOrOwner', function() {
    beforeEach('mint and approve a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
      await this.token.approve(accounts[1], 1, { from: creator });
      await this.token.setApprovalForAll(accounts[2], true, { from: creator });
    });

    context('when the specified address is a token owner', function() {
      it('returns true', async function() {
        assert.equal(await this.token.isApprovedOrOwner(creator, 1), true);
      });
    });

    context('when the specified address is a token approval', function() {
      it('returns true', async function() {
        assert.equal(await this.token.isApprovedOrOwner(accounts[1], 1), true);
      });
    });

    context('when the specified address is an operator approval', function() {
      it('returns true', async function() {
        assert.equal(await this.token.isApprovedOrOwner(accounts[2], 1), true);
      });
    });

    context("when the specified address isn't spender of the specified token", function() {
      it('returns false', async function() {
        assert.equal(await this.token.isApprovedOrOwner(accounts[3], 1), false);
      });
    });

    context('when zero address specified as a token spender', function() {
      it('reverts', async function() {
        await assertRevert(this.token.isApprovedOrOwner(ZERO_ADDRESS, 1));
      });
    });

    context("when zero address specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.isApprovedOrOwner(creator, 2));
      });
    });
  });

  describe('tokenOfOwnerByIndex', function() {
    beforeEach('mint a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
    });

    context('when sucessfull', function() {
      it('returns ID of the token that is located on the specified index in the ownedTokens array', async function() {
        assert.equal(parseNumber(await this.token.tokenOfOwnerByIndex(creator, 0)), 1);
      });
    });

    context('when zero address specified', function() {
      it('reverts', async function() {
        await assertRevert(this.token.tokenOfOwnerByIndex(ZERO_ADDRESS, 0));
      });
    });

    context(
      'when the specified index is equal or bigger than the ownedTokens array length',
      function() {
        it('reverts', async function() {
          await assertRevert(this.token.tokenOfOwnerByIndex(creator, 1));
        });
      }
    );
  });

  describe('tokenByIndex', function() {
    beforeEach('mint a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
    });

    context('when sucessfull', function() {
      it('returns ID of the token that is located on the specified index in the allTokens array', async function() {
        assert.equal(parseNumber(await this.token.tokenByIndex(0)), 1);
      });
    });

    context(
      'when the specified index is equal or bigger than the allTokens array length',
      function() {
        it('reverts', async function() {
          await assertRevert(this.token.tokenByIndex(1));
        });
      }
    );
  });

  describe('tokenURI', function() {
    beforeEach('mint a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
    });

    context('when successfull', function() {
      it('returns the specified token URI', async function() {
        assert.equal(parseString(await this.token.tokenURI(1)), '');
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.tokenURI(2));
      });
    });
  });

  describe('supportsInterface', function() {
    context('when the contract implements the specified interface', function() {
      it('returns true', async function() {
        assert.equal(await this.token.supportsInterface('0x01ffc9a7'), true);
      });
    });

    context("when the contract does't implement the specified interface", function() {
      it('returns false', async function() {
        assert.equal(await this.token.supportsInterface('0x9c22ff5f'), false);
      });
    });

    context('when zero ID specified', function() {
      it('reverts', async function() {
        await assertRevert(this.token.supportsInterface('0xffffffff'));
      });
    });
  });
});
