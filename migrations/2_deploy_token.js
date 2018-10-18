const CertChain = artifacts.require('CertChain');

module.exports = function(deployer) {
  deployer.deploy(CertChain);
};
