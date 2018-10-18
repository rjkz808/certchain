pragma solidity ^0.4.24;

import "./CertToken.sol";
import "openzeppelin-solidity/contracts/ownership/Contactable.sol";


/**
 * @title CertChain
 * @author rjkz808
 */
contract CertChain is CertToken, Contactable {
  mapping (uint256 => uint256) internal applicationDate;
  mapping (uint256 => bytes) internal standard;
  mapping (uint256 => bytes) internal agency;
  mapping (uint256 => uint256) internal cost;
  mapping (uint256 => address) internal auditor;
  mapping (uint256 => address) internal certCompany;
  mapping (uint256 => bytes32) internal QMS;
  mapping (uint256 => uint256) internal firstAuditDate;
  mapping (uint256 => bytes32) internal firstAuditReport;
  mapping (uint256 => uint256) internal secondAuditDate;
  mapping (uint256 => bytes32) internal secondAuditReport;

  /**
   * @dev Reverts, if the `msg.sender` isn't auditor of the
   * @dev specified certificate
   * @param _certId uint256 ID of the certificate
   */
  modifier onlyAuditor(uint256 _certId) {
    require(exists(_certId));
    require(msg.sender == auditor[_certId]);
    _;
  }

  /**
   * @dev Reverts, if the `msg.sender` isn't customer company
   * @dev of the specified certificate
   * @param _certId uint256 ID of the certificate
   */
  modifier onlyCertCompany(uint256 _certId) {
    require(exists(_certId));
    require(msg.sender == certCompany[_certId]);
    _;
  }

  /**
   * @dev Gets the certificate data
   * @param _certId uint256 ID of the certificate
   */
  function getCertData(uint256 _certId)
    public
    view
    returns (
      uint256 _applicationDate,
      uint256 _cost,
      address _auditor,
      address _certCompany,
      bytes _standard,
      bytes _agency,
      bytes32 _QMS
    )
  {
    require(exists(_certId));
    return(
      applicationDate[_certId],
      cost[_certId],
      auditor[_certId],
      certCompany[_certId],
      standard[_certId],
      agency[_certId],
      QMS[_certId]
    );
  }

  function getCertReport(uint256 _certId)
    public
    view
    returns (
      uint256 _firstAuditDate,
      uint256 _secondAuditDate,
      bytes32 _firstAuditReport,
      bytes32 _secondAuditReport
    )
  {
    require(exists(_certId));
    return(
      firstAuditDate[_certId],
      secondAuditDate[_certId],
      firstAuditReport[_certId],
      secondAuditReport[_certId]
    );
  }

  function apply(
    string _standard,
    string _agency,
    uint256 _cost,
    address _auditor
  )
    public
  {
    require(_cost > 0);
    require(_auditor != address(0));

    uint256 tokenId = allTokens.length.add(1);
    _mint(owner, tokenId, "");
    applicationDate[tokenId] = block.timestamp;
    standard[tokenId] = abi.encode(_standard);
    agency[tokenId] = abi.encode(_agency);
    cost[tokenId] = _cost;
    auditor[tokenId] = _auditor;
    certCompany[tokenId] = msg.sender;
  }

  function uploadQMS(uint256 _tokenId, string _qms)
    public onlyCertCompany(_tokenId)
  {
    QMS[_tokenId] = keccak256(abi.encode(_qms));
  }

  function audit(uint256 _tokenId, string _report)
    public onlyAuditor(_tokenId)
  {
    if (firstAuditDate[_tokenId] == 0) {
      firstAuditDate[_tokenId] = block.timestamp;
      firstAuditReport[_tokenId] = keccak256(abi.encode(_report));
    } else if (secondAuditDate[_tokenId] == 0) {
      secondAuditDate[_tokenId] = block.timestamp;
      secondAuditReport[_tokenId] = keccak256(abi.encode(_report));
    } else {
      revert();
    }
  }

}
