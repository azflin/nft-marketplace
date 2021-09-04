const { expect } = require("chai");

const BURN_ADDRESS = "0x000000000000000000000000000000000000dead";

describe("Marketplace contract", function () {
  before(async function () {
    this.Marketplace = await ethers.getContractFactory("Marketplace");
    this.DummyNFT = await ethers.getContractFactory("DummyNFT");
    this.Weth = await ethers.getContractFactory("Weth");
  });

  beforeEach(async function () {
    weth = await this.Weth.deploy(ethers.BigNumber.from(1000n * 10n ** 18n));
    await weth.deployed();
    this.weth = await ethers.getContractAt("Weth", weth.address);
    marketplace = await this.Marketplace.deploy(weth.address);
    await marketplace.deployed();
    dummyNFT = await this.DummyNFT.deploy();
    await dummyNFT.deployed();

    [this.account1, this.account2, this.account3] = await ethers.getSigners();
    this.marketplace = await ethers.getContractAt(
      "Marketplace",
      marketplace.address
    );
    this.dummyNFT = await ethers.getContractAt("DummyNFT", dummyNFT.address);
    // Give account1 NFT id 1 and give account 2 NFT id 2
    this.dummyNFT.mintDNFT(this.account1.address, "");
    this.dummyNFT.mintDNFT(this.account2.address, "");
    // Approve marketplace to spend account1's WETH and account 3's WETH
    let connectedWeth = this.weth.connect(this.account1);
    await connectedWeth.approve(
      marketplace.address,
      ethers.constants.MaxUint256
    );
    connectedWeth = this.weth.connect(this.account3);
    await connectedWeth.approve(
      marketplace.address,
      ethers.constants.MaxUint256
    );
  });

  it("should not make offer for NFT you don't own", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(this.marketplace.makeOffer(this.dummyNFT.address, 2, 42)).to.be
      .reverted;
    this.marketplace = this.marketplace.connect(this.account2);
    await expect(this.marketplace.makeOffer(this.dummyNFT.address, 1, 42)).to.be
      .reverted;
  });

  it("should not make offer if 0 price", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(this.marketplace.makeOffer(this.dummyNFT.address, 1, 0)).to.be
      .reverted;
  });

  it("should allow you to offer an NFT", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(
      this.marketplace.makeOffer(
        this.dummyNFT.address,
        1,
        ethers.utils.parseEther("1")
      )
    )
      .to.emit(this.marketplace, "NewOffer")
      .withArgs(
        this.account1.address,
        ethers.utils.parseEther("1"),
        this.dummyNFT.address,
        1
      );
    let offer = await this.marketplace.offers(this.dummyNFT.address, 1);
    expect(offer.seller).to.equal(this.account1.address);
    expect(offer.price).to.equal(ethers.utils.parseEther("1"));
  });

  it("should allow you to overwrite price of offer", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(
      this.dummyNFT.address,
      1,
      ethers.utils.parseEther("1")
    );
    await this.marketplace.makeOffer(
      this.dummyNFT.address,
      1,
      ethers.utils.parseEther("2")
    );
    let offer = await this.marketplace.offers(this.dummyNFT.address, 1);
    expect(offer.seller).to.equal(this.account1.address);
    expect(offer.price).to.equal(ethers.utils.parseEther("2"));
  });

  it("should revert takeOffer if NFT not for sale", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1)
    ).to.be.revertedWith("NFT not for sale.");
    // Try the burn address as the ERC721
    await expect(
      this.marketplace.takeOffer(BURN_ADDRESS, 69)
    ).to.be.revertedWith("NFT not for sale.");
  });

  it("should revert takeOffer if insufficient payment", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(
      this.dummyNFT.address,
      1,
      ethers.utils.parseEther("1")
    );
    this.marketplace = this.marketplace.connect(this.account2);
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {
        value: ethers.utils.parseEther("0.99"),
      })
    ).to.be.revertedWith("Insufficient payment.");
  });

  it("should revert takeOffer if seller no longer owns NFT", async function () {
    // Account 1 lists offer on market place, then transfers NFT out
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(
      this.dummyNFT.address,
      1,
      ethers.utils.parseEther("1")
    );
    this.dummyNFT = this.dummyNFT.connect(this.account1);
    this.dummyNFT.transferFrom(this.account1.address, this.account2.address, 1);
    this.marketplace = this.marketplace.connect(this.account3);
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("Seller no longer owns this NFT.");
  });

  it("should revert takeOffer if attempting to take own offer", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(
      this.dummyNFT.address,
      1,
      ethers.utils.parseEther("1")
    );
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("Cannot take your own offer.");
  });

  it("should takeOffer", async function () {
    // Account 1 makes an offer of NFT 1 for 1 ether
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(
      this.dummyNFT.address,
      1,
      ethers.utils.parseEther("1")
    );

    // Account 3 makes a bid on NFT 1 for 0.5 ether
    this.marketplace = this.marketplace.connect(this.account3);
    await this.marketplace.makeBid(
      this.dummyNFT.address,
      1,
      ethers.utils.parseEther("0.5")
    );
    let bid = await this.marketplace.bids(this.dummyNFT.address, 1);
    expect(bid.bidder).to.be.equal(this.account3.address);
    expect(bid.price).to.be.equal(ethers.utils.parseEther("0.5"));

    // Account 1 has to approve the marketplace to transfer the NFT
    this.dummyNFT = this.dummyNFT.connect(this.account1);
    await this.dummyNFT.setApprovalForAll(this.marketplace.address, true);

    // Account 2 takes this offer
    this.marketplace = this.marketplace.connect(this.account2);
    let oldBalance = await ethers.provider.getBalance(this.account2.address);
    // Check to see Sale event emitted
    await expect(
      this.marketplace.takeOffer(this.dummyNFT.address, 1, {
        value: ethers.utils.parseEther("1"),
      })
    )
      .to.emit(this.marketplace, "Sale")
      .withArgs(
        this.account2.address,
        this.account1.address,
        ethers.utils.parseEther("1"),
        this.dummyNFT.address,
        1
      );
    // Check the new ownership of NFT 1 is Account 2
    expect(await this.dummyNFT.ownerOf(1)).to.be.equal(this.account2.address);
    // Check balance of account 2 is less.
    let newBalance = await ethers.provider.getBalance(this.account2.address);
    // Difference should be slightly greater because of gas
    expect(oldBalance.sub(newBalance)).to.be.gt(ethers.utils.parseEther("1"));
    // There should be no more offer for that NFT
    let offer = await this.marketplace.offers(this.dummyNFT.address, 1);
    expect(offer.seller).to.be.equal(ethers.constants.AddressZero);
    expect(offer.price).to.be.equal(0);
    // There should also be no more bid on that NFT
    bid = await this.marketplace.bids(this.dummyNFT.address, 1);
    expect(bid.bidder).to.be.equal(ethers.constants.AddressZero);
    expect(bid.price).to.be.equal(0);
  });

  it("should revert makeBid if bidding on your own NFT", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(
      this.marketplace.makeBid(
        this.dummyNFT.address,
        1,
        ethers.utils.parseEther("1")
      )
    ).to.be.revertedWith("You cannot bid on your own NFT.");
  });

  it("should revert makeBid if bid is less than last bid", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(
      this.marketplace.makeBid(this.dummyNFT.address, 2, 0)
    ).to.be.revertedWith("Bid must be greater than last bid.");

    await this.marketplace.makeBid(this.dummyNFT.address, 2, 2);

    await expect(
      this.marketplace.makeBid(this.dummyNFT.address, 2, 1)
    ).to.be.revertedWith("Bid must be greater than last bid.");
  });

  it("should revert makeBid if you didnt give the contract allowance to spend your ETH", async function () {
    this.weth = this.weth.connect(this.account1);
    await this.weth.approve(this.marketplace.address, 0);
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(
      this.marketplace.makeBid(
        this.dummyNFT.address,
        2,
        ethers.utils.parseEther("1")
      )
    ).to.be.revertedWith(
      "You did not give allowance for marketplace to spend your WETH."
    );
  });

  it("should makeBid", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(
      this.marketplace.makeBid(
        this.dummyNFT.address,
        2,
        ethers.utils.parseEther("1")
      )
    )
      .to.emit(this.marketplace, "NewBid")
      .withArgs(
        this.account1.address,
        ethers.utils.parseEther("1"),
        this.dummyNFT.address,
        2
      );
    const bid = await this.marketplace.bids(this.dummyNFT.address, 2);
    expect(bid.bidder).to.be.equal(this.account1.address);
    expect(bid.price).to.be.equal(ethers.utils.parseEther("1"));
  });

  it("should revert takeBid if you don't own NFT", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeBid(
      this.dummyNFT.address,
      2,
      ethers.utils.parseEther("1")
    );
    this.marketplace = this.marketplace.connect(this.account3);
    await expect(
      this.marketplace.takeBid(this.dummyNFT.address, 2)
    ).to.be.revertedWith("You do not own this NFT.");
  });

  it("should revert takeBid if there is no bid", async function () {
    this.marketplace = this.marketplace.connect(this.account2);
    await expect(
      this.marketplace.takeBid(this.dummyNFT.address, 2)
    ).to.be.revertedWith("There is no bid.");
  });

  it("should takeBid", async function () {
    // Account 1 makes a bid of NFT 2 for 1 ether
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeBid(
      this.dummyNFT.address,
      2,
      ethers.utils.parseEther("1")
    );

    // Account 2 makes an offer of NFT 2 for 2 ether
    this.marketplace = this.marketplace.connect(this.account2);
    await this.marketplace.makeOffer(
      this.dummyNFT.address,
      2,
      ethers.utils.parseEther("2")
    );
    let offer = await this.marketplace.offers(this.dummyNFT.address, 2);
    expect(offer.seller).to.be.equal(this.account2.address);
    expect(offer.price).to.be.equal(ethers.utils.parseEther("2"));

    // Account 2 has to approve the marketplace to transfer the NFT
    this.dummyNFT = this.dummyNFT.connect(this.account2);
    await this.dummyNFT.setApprovalForAll(this.marketplace.address, true);

    // Account 2 takes this bid
    // Check to see Sale event emitted
    await expect(this.marketplace.takeBid(this.dummyNFT.address, 2))
      .to.emit(this.marketplace, "Sale")
      .withArgs(
        this.account1.address,
        this.account2.address,
        ethers.utils.parseEther("1"),
        this.dummyNFT.address,
        2
      );
    // Check the new ownership of NFT 2 is Account 1
    expect(await this.dummyNFT.ownerOf(2)).to.be.equal(this.account1.address);
    // Check balance of account 2 is 1 WETH.
    expect(await weth.balanceOf(this.account2.address)).to.be.equal(
      ethers.utils.parseEther("1")
    );
    // Check balance of account 1 is 1 WETH less.
    expect(await weth.balanceOf(this.account1.address)).to.be.equal(
      ethers.utils.parseEther("999")
    );
    // There should be no more offer for that NFT
    offer = await this.marketplace.offers(this.dummyNFT.address, 2);
    expect(offer.seller).to.be.equal(ethers.constants.AddressZero);
    expect(offer.price).to.be.equal(0);
    // There should also be no more bid on that NFT
    bid = await this.marketplace.bids(this.dummyNFT.address, 2);
    expect(bid.bidder).to.be.equal(ethers.constants.AddressZero);
    expect(bid.price).to.be.equal(0);
  });

  it("should revert removeOffer if you don't own the NFT", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await expect(
      this.marketplace.removeOffer(this.dummyNFT.address, 2)
    ).to.be.revertedWith("You do not own this NFT.");
  });

  it("should removeOffer", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeOffer(
      this.dummyNFT.address,
      1,
      ethers.utils.parseEther("1")
    );
    await expect(this.marketplace.removeOffer(this.dummyNFT.address, 1))
      .to.emit(this.marketplace, "NewOffer")
      .withArgs(ethers.constants.AddressZero, 0, this.dummyNFT.address, 1);
    let offer = await this.marketplace.offers(this.dummyNFT.address, 1);
    expect(offer.seller).to.be.equal(ethers.constants.AddressZero);
    expect(offer.price).to.be.equal(0);
  });

  it("should revert removeBid if you aren't the bidder", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeBid(
      this.dummyNFT.address,
      2,
      ethers.utils.parseEther("1")
    );
    this.marketplace = this.marketplace.connect(this.account3);
    await expect(
      this.marketplace.removeBid(this.dummyNFT.address, 2)
    ).to.be.revertedWith("You are not the bidder.");
  });

  it("should removeBid", async function () {
    this.marketplace = this.marketplace.connect(this.account1);
    await this.marketplace.makeBid(
      this.dummyNFT.address,
      2,
      ethers.utils.parseEther("1")
    );
    await expect(this.marketplace.removeBid(this.dummyNFT.address, 2))
      .to.emit(this.marketplace, "NewBid")
      .withArgs(ethers.constants.AddressZero, 0, this.dummyNFT.address, 2);
    let bid = await this.marketplace.bids(this.dummyNFT.address, 2);
    expect(bid.bidder).to.be.equal(ethers.constants.AddressZero);
    expect(bid.price).to.be.equal(0);
  });
});
