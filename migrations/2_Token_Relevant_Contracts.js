const TokenContract = artifacts.require('PBToken')
const EventContract = artifacts.require('EventTokenDistributor')
const PurchaseContract = artifacts.require('PurchaseDetails')

module.exports = async function (deployer) {
    await deployer.deploy(TokenContract);

    const tokenContractInstance = await TokenContract.deployed()

    await deployer.deploy(EventContract, tokenContractInstance.address);

    await deployer.deploy(PurchaseContract, tokenContractInstance.address);
};