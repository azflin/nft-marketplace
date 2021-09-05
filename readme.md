# Smart contract and backend for NFT marketplace


## TESTING

___RUN Scripts in this order to see how database updates___

	- npx hardhat node. 
	- npx hardhat run scripts/deploy.js --network localhost
	- npx hardhat run scripts/mint.js --network localhost
	- npx hardhat run scripts/fundWeth.js --network localhost

	- node backend/contractEventListener.js

	- npx hardhat run scripts/makeBid.js --network localhost
	- npx hardhat run scripts/takeBid.js --network localhost
	- npx hardhat run scripts/makeOffer.js --network localhost
	- npx hardhat run scripts/takeOffer.js --network localhost
	- npx hardhat run scripts/makeRemoveBid.js --network localhost
	- npx hardhat run scripts/makeRemoveOffer.js --network localhost