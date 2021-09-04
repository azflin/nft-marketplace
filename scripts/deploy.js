require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");

const { saveDeployedAddress } = require("../helpers");

const contractNames = {
  marketPlace: "MarketPlace",
  nft: "DummyNFT",
  weth: "WrappedEther",
};

async function main() {
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const DummyNFT = await hre.ethers.getContractFactory("DummyNFT");
  const Weth = await hre.ethers.getContractFactory("Weth");

  const weth = await Weth.deploy(ethers.BigNumber.from(1000n * 10n ** 18n));
  await weth.deployed();
  console.log(`Wrapped ether deployed at ${weth.address}`);
  //   Save address so that you dont have to keep copy pasting on local development
  saveDeployedAddress({ contractName: contractNames.weth, contract: weth });

  const marketplace = await Marketplace.deploy(weth.address);
  await marketplace.deployed();
  console.log(`Market Place deployed at ${marketplace.address}`);
  //   Save address so that you dont have to keep copy pasting on local development
  saveDeployedAddress({
    contractName: contractNames.marketPlace,
    contract: marketplace,
  });

  const dummyNFT = await DummyNFT.deploy();
  await dummyNFT.deployed();
  console.log(`Dummy NFT deployed at ${dummyNFT.address}`);
  //   Save address so that you dont have to keep copy pasting on local development
  saveDeployedAddress({ contractName: contractNames.nft, contract: dummyNFT });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
