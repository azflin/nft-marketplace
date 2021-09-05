require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const {
  ethers: { utils },
} = hre;
const deployedAddresses = require("../helpers/deployedAddress.json");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function main() {
  const signers = await ethers.getSigners();
  let account1 = signers[3];
  const marketplace = await ethers.getContractAt(
    "Marketplace",
    deployedAddresses.MarketPlace
  );

  const bidAmount = utils.parseEther("0.512");
  const tx1 = await marketplace
    .connect(account1)
    .makeBid(deployedAddresses.DummyNFT, 1, bidAmount);
  const reciept1 = await tx1.wait();
  let newBidEvent1 = reciept1.events[0].args;

  console.log(
    `New bid of ${utils.formatEther(newBidEvent1.price)}Weth recieved for ${
      newBidEvent1.erc721
    } with tokenId ${newBidEvent1.tokenId.toNumber()}  from ${
      newBidEvent1.bidder
    }`
  );

  await delay(2000);
  const tx2 = await marketplace
    .connect(account1)
    .removeBid(deployedAddresses.DummyNFT, 1);
  const reciept2 = await tx2.wait();
  let newBidEvent2 = reciept2.events[0].args;

  console.log(
    `Bid removed for tokenId ${newBidEvent2.tokenId.toNumber()} of contract address  ${
      newBidEvent2.erc721
    } `
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
