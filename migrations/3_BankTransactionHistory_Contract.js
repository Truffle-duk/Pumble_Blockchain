const BTH_Contract = artifacts.require('BankTransactionHistory')

module.exports = function (deployer) {
    deployer.deploy(BTH_Contract);
};