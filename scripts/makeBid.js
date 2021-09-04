require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const {
  ethers: { utils },
} = hre;
const deployedAddresses = require("../helpers/deployedAddress.json");

async function main() {
  const signers = await ethers.getSigners();
  let account1 = signers[3];
  let account2 = signers[4];
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
  const tx2 = await marketplace
    .connect(account2)
    .makeBid(deployedAddresses.DummyNFT, 2, bidAmount);
  const reciept2 = await tx2.wait();
  let newBidEvent2 = reciept2.events[0].args;

  console.log(
    `New bid of ${utils.formatEther(newBidEvent2.price)}Weth recieved for ${
      newBidEvent2.erc721
    } with tokenId ${newBidEvent2.tokenId.toNumber()}  from ${
      newBidEvent2.bidder
    }`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
