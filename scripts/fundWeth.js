require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const {
  ethers: { utils },
} = hre;
const deployedAddresses = require("../helpers/deployedAddress.json");

async function main() {
  const signers = await ethers.getSigners();

  const account1 = signers[1];
  const account2 = signers[2];
  const account3 = signers[3];
  const account4 = signers[4];
  const transferAmount = utils.parseEther("10");

  const weth = await ethers.getContractAt(
    "Weth",
    deployedAddresses.WrappedEther
  );

  const tx1 = await weth.transfer(account1.address, transferAmount);
  const reciept1 = await tx1.wait();
  let transferEvent = reciept1.events[0].args;
  console.log(
    `Funded ${utils.formatEther(transferEvent.value)} Weth from ${
      transferEvent.from
    } to ${transferEvent.to} `
  );
  // Approve marketplace to spend WETH
  await weth
    .connect(account1)
    .approve(deployedAddresses.MarketPlace, transferAmount);

  const tx2 = await weth.transfer(account2.address, transferAmount);
  const reciept2 = await tx2.wait();
  transferEvent = reciept2.events[0].args;
  console.log(
    `Funded ${utils.formatEther(transferEvent.value)} Weth from ${
      transferEvent.from
    } to ${transferEvent.to} `
  );
  // Approve marketplace to spend WETH
  await weth
    .connect(account2)
    .approve(deployedAddresses.MarketPlace, transferAmount);

  const tx3 = await weth.transfer(account3.address, transferAmount);
  const reciept3 = await tx3.wait();
  transferEvent = reciept3.events[0].args;
  console.log(
    `Funded ${utils.formatEther(transferEvent.value)} Weth from ${
      transferEvent.from
    } to ${transferEvent.to} `
  );
  // Approve marketplace to spend WETH
  await weth
    .connect(account3)
    .approve(deployedAddresses.MarketPlace, transferAmount);

  const tx4 = await weth.transfer(account4.address, transferAmount);
  const reciept4 = await tx4.wait();
  transferEvent = reciept4.events[0].args;
  console.log(
    `Funded ${utils.formatEther(transferEvent.value)} Weth from ${
      transferEvent.from
    } to ${transferEvent.to} `
  );
  // Approve marketplace to spend WETH
  await weth
    .connect(account4)
    .approve(deployedAddresses.MarketPlace, transferAmount);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
