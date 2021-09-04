require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const {
  ethers: { utils },
} = hre;
const deployedAddresses = require("../helpers/deployedAddress.json");

async function main() {
  const signers = await ethers.getSigners();

  const account1 = signers[3];
  const account2 = signers[4];
  const transferAmount = utils.parseEther("10");

  const weth = await ethers.getContractAt(
    "Weth",
    deployedAddresses.WrappedEther
  );

  const tx = await weth.transfer(account1.address, transferAmount);
  const reciept = await tx.wait();
  let transferEvent = reciept.events[0].args;
  console.log(
    `Funded ${utils.formatEther(transferEvent.value)} Weth from ${
      transferEvent.from
    } to ${transferEvent.to} `
  );
  await weth
    .connect(account1)
    .approve(deployedAddresses.MarketPlace, transferAmount);

  const tx1 = await weth.transfer(account2.address, transferAmount);
  const reciept1 = await tx1.wait();
  transferEvent = reciept1.events[0].args;
  console.log(
    `Funded ${utils.formatEther(transferEvent.value)} Weth from ${
      transferEvent.from
    } to ${transferEvent.to} `
  );
  await weth
    .connect(account2)
    .approve(deployedAddresses.MarketPlace, transferAmount);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
