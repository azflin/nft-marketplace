const ethers = require("ethers");
const marketplaceArtifact = require("../artifacts/contracts/Marketplace.sol/Marketplace.json");
const deployedAddresses = require("../helpers/deployedAddress.json");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const provider = new ethers.providers.JsonRpcProvider();

const contract = new ethers.Contract(
  deployedAddresses.MarketPlace,
  marketplaceArtifact.abi,
  provider
);
const db = [];
contract.on("NewBid", async (bidder, price, erc721, tokenId, args) => {
  await delay(1000);
  console.log(args.blockNumber);
  price = ethers.utils.formatEther(price);
  console.log(
    `New bid of ${price}Weth has been submitted from ${bidder} for tokenId ${tokenId.toNumber()} of contract ${erc721}`
  );
  let index;
  db.forEach((_token, i) => {
    if (
      _token.contractAddress === erc721 &&
      _token.tokenId === tokenId.toNumber()
    ) {
      console.log("here");
      index = i;
      db[index].bidder = bidder;
      db[index].tokenId = tokenId.toNumber();
      db[index].contractAddress = erc721;
      db[index].bidPrice = price;
    }
  });
  if (!index) {
    db.push({
      bidder,
      seller: "",
      bidPrice: price,
      offerPrice: "",
      tokenId: tokenId.toNumber(),
      contractAddress: erc721,
    });
  }
  console.log(db);
});

contract.on("Sale", async (buyer, seller, price, erc721, tokenId) => {
  await delay(1000);
  console.log(
    `Sold NFT with tokenId ${tokenId.toNumber()} of contract ${erc721} for ${ethers.utils.formatEther(
      price
    )}Weth to ${buyer} from ${seller}`
  );
  let index;
  db.forEach((_token, i) => {
    if (
      _token.contractAddress === erc721 &&
      _token.tokenId === tokenId.toNumber()
    ) {
      index = i;
    }
  });
  if (index) {
    db[index].bidder = "";
    db[index].tokenId = tokenId.toNumber();
    db[index].contractAddress = erc721;
    db[index].bidPrice = "";
    db[index].offerPrice = "";
    db[index].seller = "";
  }
  console.log(db);
});

contract.on("NewOffer", async (seller, price, erc721, tokenId) => {
  await delay(1000);
  price = ethers.utils.formatEther(price);
  console.log(
    `New offer of ${price}Weth recieved for ${erc721} with tokenId ${tokenId.toNumber()}  from ${seller}`
  );
  let index;
  db.forEach((_token, i) => {
    if (
      _token.contractAddress === erc721 &&
      _token.tokenId === tokenId.toNumber()
    ) {
      index = i;
    }
  });
  if (index) {
    db[index].seller = seller;
    db[index].tokenId = tokenId.toNumber();
    db[index].contractAddress = erc721;
    db[index].offerPrice = price;
  } else {
    db.push({
      seller,
      offerPrice: price,
      tokenId: tokenId.toNumber(),
      contractAddress: erc721,
    });
  }
  console.log(db);
});
