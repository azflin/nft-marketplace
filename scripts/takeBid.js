require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const {
  ethers: { utils },
} = hre;
const deployedAddresses = require("../helpers/deployedAddress.json");

async function main() {
  const signers = await ethers.getSigners();
  let account1 = signers[1];
  let account2 = signers[2];
  const marketplace = await ethers.getContractAt(
    "Marketplace",
    deployedAddresses.MarketPlace
  );

  //   First seller
  const tx1 = await marketplace
    .connect(account1)
    .takeBid(deployedAddresses.DummyNFT, 1);
  const reciept1 = await tx1.wait();
  let saleEvent = reciept1.events[reciept1.events.length - 1].args;
  console.log(
    `Sold NFT with tokenId ${saleEvent.tokenId.toNumber()} of contract ${
      saleEvent.erc721
    } for ${utils.formatEther(saleEvent.price)}Weth to ${
      saleEvent.buyer
    } from ${saleEvent.seller}`
  );

  //   Second seller
  const tx2 = await marketplace
    .connect(account2)
    .takeBid(deployedAddresses.DummyNFT, 2);
  const reciept2 = await tx2.wait();
  saleEvent = reciept2.events[reciept2.events.length - 1].args;
  console.log(
    `Sold NFT with tokenId ${saleEvent.tokenId.toNumber()} of contract ${
      saleEvent.erc721
    } for ${utils.formatEther(saleEvent.price)}Weth to ${
      saleEvent.buyer
    } from ${saleEvent.seller}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
