const { ethers, getNamedAccounts, network } = require("hardhat")
const { getWeth, AMOUNT } = require("./getWeth")
const { networkConfig } = require("../helper-hardhat-config")
const { BigNumber } = require("@ethersproject/bignumber")

const chainId = network.config.chainId

async function main() {
    // Deposito ETH y obtengo WETH
    await getWeth()
    const { deployer } = await getNamedAccounts()
    const lendingPool = await getLendingPool(deployer)
    const wethTokenAddress = networkConfig[chainId].wethToken
    // Le doy aprobacion a la lendingPool que use mis WETH
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing WETH")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("WETH deposited!!!")
}

async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        networkConfig[chainId].lendingPoolAddressesProvider,
        account
    )
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool()
    const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
    return lendingPool
}

async function approveErc20(erc20Address, spenderAddress, amount, signer) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, signer)
    txResponse = await erc20Token.approve(spenderAddress, amount)
    await txResponse.wait(1)
    console.log("Approved!!!")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
