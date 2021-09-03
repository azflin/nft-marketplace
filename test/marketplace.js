const { expect } = require("chai");

const BURN_ADDRESS = "0x000000000000000000000000000000000000dead";

describe("Marketplace contract", function () {
  before(async function () {
    this.Marketplace = await ethers.getContractFactory('Marketplace');
    this.DummyNFT = await ethers.getContractFactory('DummyNFT');
    this.Weth = await ethers.getContractFactory('Weth');
  });

  beforeEach(async function () {
    weth = await this.Weth.deploy(ethers.BigNumber.from(1000n * 10n**18n));
    await weth.deployed();
    this.weth = await ethers.getContractAt("Weth", weth.address);
    marketplace = await this.Marketplace.deploy(weth.address);
    await marketplace.deployed();
    dummyNFT = await this.DummyNFT.deploy();
    await dummyNFT.deployed();

    [this.account1, this.account2, this.account3] = await ethers.getSigners();
    this.marketplace = await ethers.getContractAt("Marketplace", marketplace.address);
    this.dummyNFT = await ethers.getContractAt("DummyNFT", dummyNFT.address);
    this.dummyNFT.mintDNFT(this.account1.address, '');
    this.dummyNFT.mintDNFT(this.account2.address, '');
  });

  it("should not make offer for NFT you don't own", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(this.marketplace.makeOffer(this.dummyNFT.address, 2, 42)).to.be.reverted;
    this.marketplace = this.marketplace.connect(this.account2);
    await expect(this.marketplace.makeOffer(this.dummyNFT.address, 1, 42)).to.be.reverted;
  });

  it("should not make offer if 0 price", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(this.marketplace.makeOffer(this.dummyNFT.address, 1, 0)).to.be.reverted;
  });

  it("should allow you to offer an NFT", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    let offer = await this.marketplace.offers(this.dummyNFT.address, 1);
    expect(offer.seller).to.equal(this.account1.address);
    expect(offer.price).to.equal(ethers.utils.parseEther("1"));
  });

  it("should allow you to overwrite price of offer", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("2"));
    let offer = await this.marketplace.offers(this.dummyNFT.address, 1);
    expect(offer.seller).to.equal(this.account1.address);
    expect(offer.price).to.equal(ethers.utils.parseEther("2"));
  });

  it("should revert takeOffer if NFT not for sale", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(this.marketplace.takeOffer(this.dummyNFT.address, 1)).to.be.revertedWith("NFT not for sale.");
    // Try the burn address as the ERC721
    await expect(
      this.marketplace.takeOffer(BURN_ADDRESS, 69)
    ).to.be.revertedWith("NFT not for sale.");
  });

  it("should revert takeOffer if insufficient payment", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    this.marketplace = this.marketplace.connect(this.account2);
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {value: ethers.utils.parseEther("0.99")})
    ).to.be.revertedWith("Insufficient payment.");
  });

  it("should revert takeOffer if seller no longer owns NFT", async function () {
    // Account 1 lists offer on market place, then transfers NFT out
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    this.dummyNFT = this.dummyNFT.connect(this.account1);
    this.dummyNFT.transferFrom(this.account1.address, this.account2.address, 1);
    this.marketplace = this.marketplace.connect(this.account3);
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {value: ethers.utils.parseEther("1")})
    ).to.be.revertedWith("Seller no longer owns this NFT.");
  });

  it("should revert takeOffer if attempting to take own offer", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {value: ethers.utils.parseEther("1")})
    ).to.be.revertedWith("Cannot take your own offer.");
  });

  it("should takeOffer", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    this.dummyNFT = this.dummyNFT.connect(this.account1);
    await this.dummyNFT.setApprovalForAll(this.marketplace.address, true);
    this.marketplace = this.marketplace.connect(this.account2);
    let oldBalance = await ethers.provider.getBalance(this.account2.address);
    await this.marketplace.takeOffer(this.dummyNFT.address, 1, {value: ethers.utils.parseEther("1")});
    expect(await this.dummyNFT.ownerOf(1)).to.be.equal(this.account2.address);
    let newBalance = await ethers.provider.getBalance(this.account2.address);
    // Difference should be slightly greater because of gas
    expect(oldBalance.sub(newBalance)).to.be.gt(ethers.utils.parseEther("1"));
  });

  it("should revert makeBid if bidding on your own NFT", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(
      this.marketplace.makeBid(this.dummyNFT.address, 1, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("You cannot bid on your own NFT.");
  });
});