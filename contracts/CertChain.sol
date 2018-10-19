pragma solidity ^0.4.24;

import "./CertToken.sol";
import "openzeppelin-solidity/contracts/ownership/Contactable.sol";


/**
 * @title CertChain
 * @author rjkz808
 */
contract CertChain is CertToken, Contactable {
  mapping (uint256 => uint256) internal applicationDate;
  mapping (uint256 => string) internal standard;
  mapping (uint256 => string) internal agency;
  mapping (uint256 => uint256) internal cost;
  mapping (uint256 => address) internal auditor;
  mapping (uint256 => address) internal customerCompany;
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
  modifier onlyCustomerCompany(uint256 _certId) {
    require(exists(_certId));
    require(msg.sender == customerCompany[_certId]);
    _;
  }

  /**
   * @dev Gets the certificate data
   * @param _certId uint256 ID of the certificate
   * @return {
     "_applicationDate": "uint256 the certificate application date",
     "_cost": "uint256 the certificate cost"
     "_auditor": "address the certificate auditor"
     "_company": "address the certificate customer company
     "_standard": "string the certificate standard"
     "_agency": "string the certificate agency"
     "_QMS": "bytes32 the certificate QMS documentation hash"
   }
   */
  function getCertData(uint256 _certId)
    public
    view
    returns (
      uint256 _applicationDate,
      uint256 _cost,
      address _auditor,
      address _company,
      string _standard,
      string _agency,
      bytes32 _QMS
    )
  {
    require(exists(_certId));
    return(
      applicationDate[_certId],
      cost[_certId],
      auditor[_certId],
      customerCompany[_certId],
      standard[_certId],
      agency[_certId],
      QMS[_certId]
    );
  }

  /**
   * @dev Gets the certificate audit data
   * @param _certId uint256 ID of the certificate
   * @return {
     "_firstAuditDate": "uint256 the first audit date",
     "_firstAuditReport": "bytes32 the first audit report"
     "_secondAuditDate": "uint256 the second audit date"
     "_secondAuditReport": "bytes32 the second audit report"
   }
   */
  function getCertAudit(uint256 _certId)
    public
    view
    returns (
      uint256 _firstAuditDate,
      bytes32 _firstAuditReport,
      uint256 _secondAuditDate,
      bytes32 _secondAuditReport
    )
  {
    require(exists(_certId));
    return(
      firstAuditDate[_certId],
      firstAuditReport[_certId],
      secondAuditDate[_certId],
      secondAuditReport[_certId]
    );
  }

  /**
   * @dev Function for certificate application
   * @param _standard string the certificate standard
   * @param _agency string the certificate standard
   * @param _cost uint256 the certificate cost
   * @param _auditor address the certificate auditor
   */
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
    require(_auditor != msg.sender);
    require(msg.sender != owner);

    uint256 certId = allTokens.length.add(1);
    _mint(owner, certId, "");
    applicationDate[certId] = block.timestamp;
    cost[certId] = _cost;
    auditor[certId] = _auditor;
    customerCompany[certId] = msg.sender;
    standard[certId] = _standard;
    agency[certId] = _agency;
  }

  /**
   * @dev Function to upload the certificate QMS documentation
   * @param _certId uint256 ID of the certificate
   * @param _qms string the QMS documentation
   */
  function uploadQMS(uint256 _certId, string _qms)
    public onlyCustomerCompany(_certId)
  {
    require(ownerOf(_certId) == owner);
    QMS[_certId] = keccak256(bytes(_qms));
  }

  /**
   * @dev Function to audit the certificate
   * @param _certId uint256 ID of the certificate
   * @param _report string the audit report
   */
  function audit(uint256 _certId, string _report)
    public onlyAuditor(_certId)
  {
    require(ownerOf(_certId) == owner);
    require(QMS[_certId] != bytes32(0));

    if (firstAuditDate[_certId] == 0) {
      firstAuditDate[_certId] = block.timestamp;
      firstAuditReport[_certId] = keccak256(bytes(_report));
    } else if (secondAuditDate[_certId] == 0) {
      secondAuditDate[_certId] = block.timestamp;
      secondAuditReport[_certId] = keccak256(bytes(_report));
    } else {
      revert();
    }
  }

}
