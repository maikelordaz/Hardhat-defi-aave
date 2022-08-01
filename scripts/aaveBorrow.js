const { ethers, getNamedAccounts, network } = require("hardhat")
const { getWeth, AMOUNT } = require("./getWeth")
const { networkConfig } = require("../helper-hardhat-config")
const { BigNumber } = require("@ethersproject/bignumber")

const chainId = network.config.chainId

async function main() {
    // documentacion de AAVE https://docs.aave.com/developers/v/2.0/
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
    // Borrow stats
    // Esto es let porque va a estar variando con el tiempo
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)
    const daiPrice = await getDaiPrice()
    // Multiplico por 0.95 para pedir prestado solo el 95% de lo que puedo
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`)
    await borrowDai(networkConfig[chainId].daiToken, lendingPool, amountDaiToBorrowWei, deployer)
}

// Una funcion para obtener la pool
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

// Una funcion para aprobar a alguien el uso de los token
async function approveErc20(erc20Address, spenderAddress, amount, signer) {
    const erc20Token = await ethers.getContractAt("IERC20", erc20Address, signer)
    txResponse = await erc20Token.approve(spenderAddress, amount)
    await txResponse.wait(1)
    console.log("Approved!!!")
}

// Una funcion para obtener las estadisticas del usuario de aave
async function getBorrowUserData(lendingPool, account) {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH
    } = await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH`)
    return { availableBorrowsETH, totalDebtETH }
}

// Una funcion para obtener el precio de DAI/ETH con chainlink
async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        networkConfig[chainId].daiEthPriceFeed
    )
    /*
     * La funcion latestRoundData devuelve muchas cosas el [1] es una forma de decir que solo
     * quiero el valor de retorno en el indice 1. Recuerda que el indice empieza a contarse en 0
     */
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}

// Una funcion para pedir prestado DAI
async function borrowDai(daiAddress, lendingPool, amountDaiToBorrow, account) {
    const tx = await lendingPool.borrow(daiAddress, amountDaiToBorrow, 1, 0, account)
    await tx.wait(1)
    console.log("You've borrowed some DAI!")
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })
