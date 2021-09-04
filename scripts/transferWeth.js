require("@nomiclabs/hardhat-ethers");
const hre = require("hardhat");
const {
  ethers: { utils },
} = hre;
const deployedAddresses = require("../helpers/deployedAddress.json");

async function main() {
  let [account1, account2, account3] = await ethers.getSigners();
  const weth = await ethers.getContractAt(
    "Weth",
    deployedAddresses.WrappedEther
  );

  const tx = await weth.transfer(account2.address, utils.parseEther("10"));
  const reciept = await tx.wait();
  let transferEvent = reciept.events[0].args;

  console.log(
    `Transferred ${utils.formatEther(transferEvent.value)} Weth from ${
      transferEvent.from
    } to ${transferEvent.to} `
  );

  const tx1 = await weth.transfer(account3.address, utils.parseEther("10"));
  const reciept1 = await tx1.wait();
  transferEvent = reciept1.events[0].args;
  console.log(
    `Transferred ${utils.formatEther(transferEvent.value)} Weth from ${
      transferEvent.from
    } to ${transferEvent.to} `
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
