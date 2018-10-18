pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Receiver.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title CertChain ERC721 token standard implementation
 * @author rjkz808
 */
contract CertToken is ERC721 {
  using AddressUtils for address;
  using SafeMath for uint256;

  string internal constant name_ = "CertChain";
  string internal constant symbol_ = "CRT";
  uint8 internal constant decimals_ = 0;

  bytes4 internal constant ERC721_RECEIVED = 0x150b7a02;
  bytes4 public constant InterfaceId_ERC165 = 0x01ffc9a7;

  uint256[] internal allTokens;

  mapping (uint256 => address) internal tokenOwner;
  mapping (uint256 => address) internal tokenApproval;
  mapping (address => mapping (address => bool)) internal operatorApproval;
  mapping (address => uint256[]) internal ownedTokens;
  mapping (uint256 => uint256) internal ownedTokensIndex;
  mapping (uint256 => uint256) internal allTokensIndex;
  mapping (uint256 => string) internal tokenURIs;
  mapping (bytes4 => bool) internal supportedInterfaces;

  event Burn(address indexed owner, uint256 tokenId);
  event Mint(address indexed to, uint256 tokenId, string _uri);

  /**
   * @dev Reverts, if the `msg.sender` doesn't own the specified token
   * @param _tokenId uint256 ID of the token
   */
  modifier onlyOwnerOf(uint256 _tokenId) {
    require(msg.sender == ownerOf(_tokenId));
    _;
  }

  /**
   * @dev Constructor to register the implemented interfaces IDs
   */
  constructor() public {
    _registerInterface(InterfaceId_ERC165);
    _registerInterface(InterfaceId_ERC721);
    _registerInterface(InterfaceId_ERC721Exists);
    _registerInterface(InterfaceId_ERC721Enumerable);
    _registerInterface(InterfaceId_ERC721Metadata);
  }

  /**
   * @dev Gets the token name
   * @return string the token name
   */
  function name() external view returns (string) {
    return name_;
  }

  /**
   * @dev Gets the token short code
   * @return string the token symbol
   */
  function symbol() external view returns (string) {
    return symbol_;
  }

  /**
   * @dev Gets the token decimals
   * @notice This function is needed to keep the balance
   * @notice displayed in the MetaMask
   * @return uint8 the token decimals (0)
   */
  function decimals() external pure returns (uint8) {
    return decimals_;
  }

  /**
   * @dev Gets the total issued tokens amount
   * @return uint256 the total tokens supply
   */
  function totalSupply() public view returns (uint256) {
    return allTokens.length;
  }

  /**
   * @dev Gets the balance of an account
   * @param _owner address the tokens holder
   * @return uint256 the account owned tokens amount
   */
  function balanceOf(address _owner) public view returns (uint256) {
    require(_owner != address(0));
    return ownedTokens[_owner].length;
  }

  /**
   * @dev Gets the specified token owner
   * @param _tokenId uint256 ID of the token
   * @return address the token owner
   */
  function ownerOf(uint256 _tokenId) public view returns (address) {
    require(exists(_tokenId));
    return tokenOwner[_tokenId];
  }

  /**
   * @dev Gets the token existence state
   * @param _tokenId uint256 ID of the token
   * @return bool the token existence state
   */
  function exists(uint256 _tokenId) public view returns (bool) {
    return tokenOwner[_tokenId] != address(0);
  }

  /**
   * @dev Gets the token approval
   * @param _tokenId uint256 ID of the token
   * @return address the token spender
   */
  function getApproved(uint256 _tokenId) public view returns (address) {
    require(exists(_tokenId));
    return tokenApproval[_tokenId];
  }

  /**
   * @dev Gets the operator approval state
   * @param _owner address the tokens holder
   * @param _operator address the tokens spender
   * @return bool the operator approval state
   */
  function isApprovedForAll(address _owner, address _operator)
    public view returns (bool)
  {
    require(_owner != address(0));
    require(_operator != address(0));
    return operatorApproval[_owner][_operator];
  }

  /**
   * @dev Gets the specified address token ownership/spending state
   * @param _spender address the token spender
   * @param _tokenId uint256 the spending token ID
   * @return bool the ownership/spending state
   */
  function isApprovedOrOwner(address _spender, uint256 _tokenId)
    public view returns (bool)
  {
    require(_spender != address(0));
    require(exists(_tokenId));
    return(
      _spender == ownerOf(_tokenId) ||
      _spender == getApproved(_tokenId) ||
      isApprovedForAll(ownerOf(_tokenId), _spender)
    );
  }

  /**
   * @dev Gets the token ID by the ownedTokens list index
   * @param _owner address the token owner
   * @param _index uint256 the token index
   * @return uint256 the token ID
   */
  function tokenOfOwnerByIndex(address _owner, uint256 _index)
    public view returns (uint256)
  {
    require(_owner != address(0));
    require(_index < ownedTokens[_owner].length);
    return ownedTokens[_owner][_index];
  }

  /**
   * @dev Gets the token ID by the allTokens list index
   * @param _index uint256 the token index
   * @return uint256 the token ID
   */
  function tokenByIndex(uint256 _index) public view returns (uint256) {
    require(_index < allTokens.length);
    return allTokens[_index];
  }

  /**
   * @dev Gets the token URI
   * @param _tokenId uint256 ID of the token
   * @return string the token URI
   */
  function tokenURI(uint256 _tokenId) public view returns (string) {
    require(exists(_tokenId));
    return tokenURIs[_tokenId];
  }

  /**
   * @dev Gets the interface support state
   * @param _interfaceId bytes4 ID of the interface
   * @return bool the specified interface support state
   */
  function supportsInterface(bytes4 _interfaceId)
    external view returns (bool)
  {
    require(_interfaceId != 0xffffffff);
    return supportedInterfaces[_interfaceId];
  }

  /**
   * @dev Function to approve token to spend it
   * @param _to address the token spender
   * @param _tokenId ID of the token to be approved
   */
  function approve(address _to, uint256 _tokenId) public {
    require(msg.sender == ownerOf(_tokenId));
    require(_to != address(0));
    tokenApproval[_tokenId] = _to;
    emit Approval(msg.sender, _to, _tokenId);
  }

  /**
   * @dev Function to set the operator approval for the all owned tokens
   * @param _operator address the tokens spender
   * @param _approved bool the tokens approval state
   */
  function setApprovalForAll(address _operator, bool _approved) public {
    require(_operator != address(0));
    operatorApproval[msg.sender][_operator] = _approved;
    emit ApprovalForAll(msg.sender, _operator, _approved);
  }

  /**
   * @dev Function to clear an approval of the owned token
   * @param _tokenId uint256 ID of the token
   */
  function clearApproval(uint256 _tokenId) public onlyOwnerOf(_tokenId) {
    _clearApproval(_tokenId);
  }

  /**
   * @dev Function to send the owned/approved token
   * @param _from address the token owner
   * @param _to address the token recepient
   * @param _tokenId uint256 ID of the token to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _tokenId) public {
    safeTransferFrom(_from, _to, _tokenId, "");
  }

  /**
   * @dev Function to send the owned/approved token with the
   * @dev onERC721Received function call if the token recepient is the
   * @dev smart contract
   * @param _from address the token owner
   * @param _to address the token recepient
   * @param _tokenId uint256 ID of the token to be transferred
   */
  function safeTransferFrom(address _from, address _to, uint256 _tokenId)
    public
  {
    safeTransferFrom(_from, _to, _tokenId, "");
  }

  /**
   * @dev Function to send the owned/approved token with the
   * @dev onERC721Received function call if the token recepient is the
   * @dev smart contract and with the additional transaction metadata
   * @param _from address the token owner
   * @param _to address the token recepient
   * @param _tokenId uint256 ID of the token to be transferred
   * @param _data bytes the transaction metadata
   */
  function safeTransferFrom(
    address _from,
    address _to,
    uint256 _tokenId,
    bytes _data
  )
    public
  {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    require(_to != address(0));

    _clearApproval(_tokenId);
    _removeTokenFrom(_from, _tokenId);
    _addTokenTo(_to, _tokenId);
    require(_onERC721Received(msg.sender, _from, _to, _tokenId, _data));

    emit Transfer(_from, _to, _tokenId);
  }

  /**
   * @dev Function to burn the owned token
   * @param _tokenId uint256 ID of the token to be burned
   */
  function burn(uint256 _tokenId) public onlyOwnerOf(_tokenId) {
    _burn(msg.sender, _tokenId);
  }

  /**
   * @dev Function to burn the owned/approved token
   * @param _from address the token owner
   * @param _tokenId uint256 ID of the token to be burned
   */
  function burnFrom(address _from, uint256 _tokenId) public {
    require(isApprovedOrOwner(msg.sender, _tokenId));
    _burn(_from, _tokenId);
  }

  /**
   * @dev Internal function to clear an approval of the token
   * @param _tokenId uint256 ID of the token
   */
  function _clearApproval(uint256 _tokenId) internal {
    require(exists(_tokenId));
    if (tokenApproval[_tokenId] != address(0))
      tokenApproval[_tokenId] = address(0);
    emit Approval(ownerOf(_tokenId), address(0), _tokenId);
  }

  /**
   * @dev Internal function to add the token to the account
   * @param _to address the token recepient
   * @param _tokenId uint256 ID of the token to be added
   */
  function _addTokenTo(address _to, uint256 _tokenId) internal {
    require(tokenOwner[_tokenId] == address(0));
    require(_to != address(0));
    tokenOwner[_tokenId] = _to;
    ownedTokensIndex[_tokenId] = ownedTokens[_to].length;
    ownedTokens[_to].push(_tokenId);
  }

  /**
   * @dev Internal function to remove the token from its owner address
   * @param _from address the token owner
   * @param _tokenId uint256 ID of the token
   */
  function _removeTokenFrom(address _from, uint256 _tokenId) internal {
    require(_from == ownerOf(_tokenId));
    uint256 lastToken = ownedTokens[_from][ownedTokens[_from].length.sub(1)];
    ownedTokens[_from][ownedTokensIndex[_tokenId]] = lastToken;
    ownedTokens[_from][ownedTokensIndex[lastToken]] = 0;
    ownedTokens[_from].length = ownedTokens[_from].length.sub(1);
    ownedTokensIndex[lastToken] = ownedTokensIndex[_tokenId];
    ownedTokensIndex[_tokenId] = 0;
    tokenOwner[_tokenId] = address(0);
  }

  /**
   * @dev Internal function to call the `onERC721Received` function if the
   * @dev token recepient is the smart contract
   * @param _operator address the `transfer` function caller
   * @param _from address the token owner
   * @param _to address the token recepient
   * @param _tokenId uint256 ID of the token to be transferred
   * @param _data bytes the transaction metadata
   */
  function _onERC721Received(
    address _operator,
    address _from,
    address _to,
    uint256 _tokenId,
    bytes _data
  )
    internal
    returns (bool)
  {
    if (_to.isContract()) {
      ERC721Receiver receiver = ERC721Receiver(_to);
      return ERC721_RECEIVED == receiver.onERC721Received(
        _operator,
        _from,
        _tokenId,
        _data
      );
    }
    return true;
  }

  /**
   * @dev Internal function the token
   * @param _owner address the token owner
   * @param _tokenId ID of the token to be burned
   */
  function _burn(address _owner, uint256 _tokenId) internal {
    if (bytes(tokenURIs[_tokenId]).length > 0) delete tokenURIs[_tokenId];
    _clearApproval(_tokenId);
    _removeTokenFrom(_owner, _tokenId);
    uint256 lastToken = allTokens[allTokens.length.sub(1)];
    allTokens[allTokensIndex[_tokenId]] = lastToken;
    allTokens[allTokensIndex[lastToken]] = 0;
    allTokens.length = allTokens.length.sub(1);
    allTokensIndex[lastToken] = allTokensIndex[_tokenId];
    allTokensIndex[_tokenId] = 0;

    emit Transfer(_owner, address(0), _tokenId);
    emit Burn(_owner, _tokenId);
  }

  /**
   * @dev Internal function to issue new token
   * @param _to address the token recepient
   * @param _tokenId uint256 ID of the token to be issued
   * @param _uri string the new token URI
   */
  function _mint(address _to, uint256 _tokenId, string _uri) internal {
    require(_to != address(0));
    _addTokenTo(_to, _tokenId);
    _setTokenURI(_tokenId, _uri);
    allTokensIndex[_tokenId] = allTokens.length;
    allTokens.push(_tokenId);

    emit Transfer(address(0), _to, _tokenId);
    emit Mint(_to, _tokenId, _uri);
  }

  /**
   * @dev Internal function to set the token URI
   * @param _tokenId ID of the token
   * @param _uri string the token URI
   */
  function _setTokenURI(uint256 _tokenId, string _uri) internal {
    require(exists(_tokenId));
    tokenURIs[_tokenId] = _uri;
  }

  /**
   * @dev Internal function to register the implemented interface
   * @param _interfaceId bytes4 ID of the interface
   */
  function _registerInterface(bytes4 _interfaceId) internal {
    require(_interfaceId != 0xffffffff);
    supportedInterfaces[_interfaceId] = true;
  }
}
