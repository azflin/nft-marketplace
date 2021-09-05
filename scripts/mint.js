require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const { ethers } = hre;
const deployedAddresses = require("../helpers/deployedAddress.json");

async function main() {
  const dummyNFT = await hre.ethers.getContractAt(
    "DummyNFT",
    deployedAddresses.DummyNFT
  );

  const signers = await ethers.getSigners();
  let account1 = signers[1];
  let account2 = signers[2];

  const tx = await dummyNFT.mintDNFT(account1.address, "");
  const reciept = await tx.wait();
  let tokenId = reciept.events[0].args.tokenId.toNumber();
  console.log(`Token Id ${tokenId} minted for ${account1.address}`);
  // Approve marketplace to transfer this NFT
  await dummyNFT
    .connect(account1)
    .approve(deployedAddresses.MarketPlace, tokenId);

  const tx1 = await dummyNFT.mintDNFT(account2.address, "");
  const reciept1 = await tx1.wait();
  tokenId = reciept1.events[0].args.tokenId.toNumber();
  console.log(`Token Id ${tokenId} minted for ${account2.address}`);
  // Approve marketplace to transfer this NFT
  await dummyNFT
    .connect(account2)
    .approve(deployedAddresses.MarketPlace, tokenId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
