const { expect } = require("chai");

describe("Marketplace contract", function () {
  before(async function () {
    this.Marketplace = await ethers.getContractFactory('Marketplace');
    this.DummyNFT = await ethers.getContractFactory('DummyNFT');
  });

  beforeEach(async function () {
    marketplace = await this.Marketplace.deploy();
    await marketplace.deployed();
    dummyNFT = await this.DummyNFT.deploy();
    await dummyNFT.deployed();

    [this.account1, this.account2] = await ethers.getSigners();
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

  it("should allow you to offer an NFT", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    let offer = await this.marketplace.offers(this.dummyNFT.address, 1);
    expect(offer.isForSale).to.equal(true);
    expect(offer.seller).to.equal(this.account1.address);
    expect(offer.price).to.equal(ethers.utils.parseEther("1"));
  });

  it("should allow you to overwrite price of offer", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("2"));
    let offer = await this.marketplace.offers(this.dummyNFT.address, 1);
    expect(offer.isForSale).to.equal(true);
    expect(offer.seller).to.equal(this.account1.address);
    expect(offer.price).to.equal(ethers.utils.parseEther("2"));
  });

  it("should revert takeOffer if NFT not for sale", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(this.marketplace.takeOffer(this.dummyNFT.address, 1)).to.be.revertedWith("Token not for sale.");
    // Try the dead address as the ERC721
    await expect(
      this.marketplace.takeOffer("0x000000000000000000000000000000000000dead", 69)
    ).to.be.revertedWith("Token not for sale.");
  });

  it("should revert takeOffer if insufficient payment", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    this.marketplace = this.marketplace.connect(this.account2);
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {value: ethers.utils.parseEther("0.99")})
    ).to.be.revertedWith("Insufficient payment.");
  });

  it("should revert takeOffer if attempting to take own offer", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {value: ethers.utils.parseEther("1")})
    ).to.be.revertedWith("Cannot take your own offer.");
  });

  // it("should takeOffer", async function () {
  //   this.marketplace = this.marketplace.connect(this.account1);
  //   await this.marketplace.makeOffer(this.dummyNFT.address, 1, ethers.utils.parseEther("1"));
  //   this.marketplace = this.marketplace.connect(this.account2);
  //   await this.marketplace.takeOffer(this.dummyNFT.address, 1, {value: ethers.utils.parseEther("1")});
  // });
});