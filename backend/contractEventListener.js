const ethers = require("ethers");
const marketplaceArtifact = require("../artifacts/contracts/Marketplace.sol/Marketplace.json");
const deployedAddresses = require("../helpers/deployedAddress.json");

const provider = new ethers.providers.JsonRpcProvider();

const contract = new ethers.Contract(
  deployedAddresses.MarketPlace,
  marketplaceArtifact.abi,
  provider
);
contract.on("NewBid", (bidder, price, erc721, tokenId) => {
  console.log(
    `New bid of ${ethers.utils.formatEther(
      price
    )}Weth has been submitted from ${bidder} for tokenId ${tokenId.toNumber()} of contract ${erc721}`
  );
});

contract.on("Sale", (buyer, seller, price, erc721, tokenId) => {
  console.log(
    `Sold NFT with tokenId ${tokenId.toNumber()} of contract ${erc721} for ${ethers.utils.formatEther(
      price
    )}Weth to ${buyer} from ${seller}`
  );
});
