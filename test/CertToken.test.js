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
      it('returns false', async function() {
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

  describe('approve', function() {
    let logs;

    beforeEach('mint and approve a token', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
      await this.token.apply('', '', 1, accounts[1], { from: creator });
      await this.token.transferFrom(creator, accounts[1], 2, { from: creator });
      const result = await this.token.approve(accounts[1], 1, { from: creator });
      logs = result.logs;
    });

    context('when successfull', function() {
      it('sets the token approval to the specified address', async function() {
        assert.equal(parseString(await this.token.getApproved(1)), accounts[1]);
      });

      it('emits an Approval event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, creator);
        assert.equal(logs[0].args._approved, accounts[1]);
        assert.equal(parseNumber(logs[0].args._tokenId), 1);
      });
    });

    context('when zero address specified', function() {
      it('reverts', async function() {
        await assertRevert(this.token.approve(ZERO_ADDRESS, 1, { from: creator }));
      });
    });

    context("when the msg.sender doesn't own the specified token", function() {
      it('reverts', async function() {
        await assertRevert(this.token.approve(accounts[1], 2, { from: creator }));
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.approve(accounts[1], 3, { from: creator }));
      });
    });
  });

  describe('setApprovalForAll', function() {
    let logs;

    beforeEach('set an operator approval', async function() {
      const result = await this.token.setApprovalForAll(accounts[1], true, { from: accounts[0] });
      logs = result.logs;
    });

    context('when successfull', function() {
      it('sets the operator approval', async function() {
        assert.equal(await this.token.isApprovedForAll(accounts[0], accounts[1]), true);
      });

      it('emits an ApprovalForAll event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'ApprovalForAll');
        assert.equal(logs[0].args._owner, accounts[0]);
        assert.equal(logs[0].args._operator, accounts[1]);
        assert.equal(logs[0].args._approved, true);
      });
    });

    context('when zero address specified', function() {
      it('reverts', async function() {
        await assertRevert(this.token.setApprovalForAll(ZERO_ADDRESS, true, { from: accounts[0] }));
      });
    });
  });

  describe('clearApproval', function() {
    let logs;

    beforeEach('mint and approve tokens', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
      await this.token.apply('', '', 1, accounts[1], { from: creator });
      await this.token.apply('', '', 1, accounts[1], { from: creator });
      await this.token.transferFrom(creator, accounts[1], 3, { from: creator });
      await this.token.approve(accounts[1], 1, { from: creator });
    });

    context('when the specified token approval exists', function() {
      beforeEach('clear approval', async function() {
        const result = await this.token.clearApproval(1, { from: creator });
        logs = result.logs;
      });

      it('sets the specified token approval to zero address', async function() {
        assert.equal(parseString(await this.token.getApproved(1)), ZERO_ADDRESS);
      });

      it('emits an Approval event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Approval');
        assert.equal(logs[0].args._owner, creator);
        assert.equal(logs[0].args._approved, ZERO_ADDRESS);
        assert.equal(parseNumber(logs[0].args._tokenId), 1);
      });
    });

    context("when the specified token approval doesn't exist", function() {
      beforeEach('clear approval', async function() {
        const result = await this.token.clearApproval(2, { from: creator });
        logs = result.logs;
      });

      it("doesn't do anything with the specified token approval", async function() {
        assert.equal(parseString(await this.token.getApproved(2)), ZERO_ADDRESS);
      });

      it("doesn't emit any event", async function() {
        assert.equal(logs.length, 0);
      });
    });

    context("when the msg.sender doesn't own the specified token", function() {
      it('reverts', async function() {
        await assertRevert(this.token.clearApproval(3, { from: creator }));
      });
    });

    context("when the specified token doesn't exist", function() {
      it('reverts', async function() {
        await assertRevert(this.token.clearApproval(4, { from: creator }));
      });
    });
  });

  describe('transfer', function() {
    let logs;

    beforeEach('mint tokens', async function() {
      await this.token.apply('', '', 1, accounts[1], { from: creator });
      await this.token.apply('', '', 1, accounts[1], { from: creator });
    });

    const _clearApproval = function() {
      it('clears the token approval', async function() {
        assert.equal(parseString(await this.token.getApproved(1)), ZERO_ADDRESS);
      });
    };

    const _removeTokenFrom = function() {
      it('decreases the token owner balance', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(creator)), 1);
      });

      it('moves the last token to the sent token position in the ownedTokens array', async function() {
        assert.equal(parseNumber(await this.token.tokenOfOwnerByIndex(creator, 0)), 2);
      });
    };

    const transferFrom = function() {
      _clearApproval();
      _removeTokenFrom();

      it('increases the token recepient balance', async function() {
        assert.equal(parseNumber(await this.token.balanceOf(accounts[1])), 1);
      });

      it('sets the token owner to the recepient address', async function() {
        assert.equal(parseString(await this.token.ownerOf(1)), accounts[1]);
      });

      it('adds token to the ownedTokens array', async function() {
        assert.equal(parseNumber(await this.token.tokenOfOwnerByIndex(accounts[1], 0)), 1);
      });

      it('emits a Transfer event', async function() {
        assert.equal(logs.length, 1);
        assert.equal(logs[0].event, 'Transfer');
        assert.equal(logs[0].args._from, creator);
        assert.equal(logs[0].args._to, accounts[1]);
        assert.equal(parseNumber(logs[0].args._tokenId), 1);
      });
    };

    context('transferFrom', function() {
      context('when the msg.sender owns the specified token', function() {
        beforeEach('transfer token', async function() {
          const result = await this.token.transferFrom(creator, accounts[1], 1, { from: creator });
          logs = result.logs;
        });
        transferFrom();
      });

      context('when the msg.sender spends the specified token', function() {
        beforeEach('transfer token', async function() {
          await this.token.approve(accounts[1], 1, { from: creator });
          const result = await this.token.transferFrom(creator, accounts[1], 1, {
            from: accounts[1]
          });
          logs = result.logs;
        });
        transferFrom();
      });

      context('when the msg.sender is an operator approval of the token owner', function() {
        beforeEach('transfer token', async function() {
          await this.token.setApprovalForAll(accounts[1], true, { from: creator });
          const result = await this.token.transferFrom(creator, accounts[1], 1, {
            from: accounts[1]
          });
          logs = result.logs;
        });
        transferFrom();
      });
    });
  });
});
