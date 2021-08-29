async function deploy() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const GameItem = await ethers.getContractFactory("GameItem");
  const gameItem = await GameItem.deploy();

  console.log("GameItem address:", gameItem.address);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const GameItem = await ethers.getContractFactory("GameItem");
  const gameItem = await ethers.getContractAt("GameItem", "0x5fbdb2315678afecb367f032d93f642f64180aa3");
  console.log(await gameItem.balanceOf(deployer.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });