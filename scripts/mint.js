require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const deployedAddresses = require("../helpers/deployedAddress.json");

async function main() {
  const dummyNFT = await hre.ethers.getContractAt(
    "DummyNFT",
    deployedAddresses.DummyNFT
  );

  let [account1, account2] = await ethers.getSigners();
  const tx = await dummyNFT.mintDNFT(account1.address, "");
  const reciept = await tx.wait();
  let tokenId = reciept.events[0].args.tokenId.toNumber();
  console.log(`Token Id ${tokenId} minted for ${account1.address}`);

  const tx1 = await dummyNFT.mintDNFT(account2.address, "");
  const reciept1 = await tx1.wait();
  tokenId = reciept1.events[0].args.tokenId.toNumber();
  console.log(`Token Id ${tokenId} minted for ${account2.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
