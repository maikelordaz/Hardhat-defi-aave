const { getNamedAccounts, ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

const AMOUNT = ethers.utils.parseEther("0.1")
async function getWeth() {
    const chainId = network.config.chainId
    const { deployer } = await getNamedAccounts()
    // Con getContractAt me traigo interfaces de contratos ya desplegados
    const iWeth = await ethers.getContractAt(
        "IWeth", // La interfaz que me traigo
        networkConfig[chainId].wethToken, // La direccion de la interfaz
        deployer // Quien le hace deploy
    )
    // La funcion deposit esta en la interfaz IWeth
    const txResponse = await iWeth.deposit({ value: AMOUNT })
    await txResponse.wait(1)
    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(`You got ${wethBalance} WETH!!!!`)
}

module.exports = { getWeth, AMOUNT }
