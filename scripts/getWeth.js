const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

const AMOUNT = ethers.utils.parseEther("0.1")
async function getWeth() {
    const chainId = network.config.chainId
    const { deployer } = await getNamedAccounts()
    const iWeth = await ethers.getContractAt("IWeth", networkConfig[chainId].wethToken, deployer)
    const txResponse = await iWeth.deposit({ value: AMOUNT })
    await txResponse.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(`You got ${wethBalance} WETH!!!!`)
}

module.exports = { getWeth, AMOUNT }
