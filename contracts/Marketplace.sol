// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Marketplace {

    struct Offer {
        address payable seller;
        uint price;
    }
    struct Bid {
        address bidder;
        uint price;
    }

    IERC20 public weth;
    mapping (address => mapping(uint => Offer)) public offers;
    mapping (address => mapping(uint => Bid)) public bids;

    event NewBid(address indexed bidder, uint price, address indexed erc721, uint tokenId);
    event NewOffer(address indexed seller, uint price, address indexed erc721, uint tokenId);
    event Sale(address indexed buyer, address indexed seller, uint price, address indexed erc721, uint tokenId);

    constructor(address _weth) {
        weth = IERC20(_weth);
    }

    function makeOffer(address _erc721, uint _tokenId, uint _price) public {
        require(IERC721(_erc721).ownerOf(_tokenId) == msg.sender, "You do not own this NFT.");
        require(_price > 0, "Cannot offer 0.");
        Offer memory offer = Offer(payable(msg.sender), _price);
        offers[_erc721][_tokenId] = offer;
        emit NewOffer(msg.sender, _price, _erc721, _tokenId);
    }

    function takeOffer(address _erc721, uint _tokenId) public payable {
        Offer storage offer = offers[_erc721][_tokenId];
        require(offer.price > 0, "NFT not for sale.");
        require(IERC721(_erc721).ownerOf(_tokenId) == offer.seller, "Seller no longer owns this NFT.");
        require(msg.value >= offer.price, "Insufficient payment.");
        require(offer.seller != msg.sender, "Cannot take your own offer.");
        (bool success, ) = offer.seller.call{value: msg.value}("");
        require(success, "Transfer was unsuccessful.");
        IERC721(_erc721).safeTransferFrom(offer.seller, payable(msg.sender), _tokenId);
        emit Sale(msg.sender, offer.seller, offer.price, _erc721, _tokenId);
        // Clear out offer and bid
        offer.seller = payable(address(0));
        offer.price = 0;
        Bid storage bid = bids[_erc721][_tokenId];
        bid.bidder = payable(address(0));
        bid.price = 0;
    }

    function makeBid(address _erc721, uint _tokenId, uint _bid) public {
        require(IERC721(_erc721).ownerOf(_tokenId) != msg.sender,
            "You cannot bid on your own NFT.");
        require(weth.allowance(msg.sender, address(this)) >= _bid,
            "You did not give allowance for marketplace to spend your WETH.");
        require(_bid > 0, "Bid must be > 0.");
        Bid storage bid = bids[_erc721][_tokenId];
        bid.bidder = msg.sender;
        bid.price = _bid;
        emit NewBid(msg.sender, _bid, _erc721, _tokenId);
    }

    function takeBid(address _erc721, uint _tokenId) public {
        require(IERC721(_erc721).ownerOf(_tokenId) == msg.sender, "You do not own this NFT.");
        Bid storage bid = bids[_erc721][_tokenId];
        require(bid.price > 0, "There is no bid.");
        IERC721(_erc721).safeTransferFrom(msg.sender, bid.bidder, _tokenId);
        weth.transferFrom(bid.bidder, msg.sender, bid.price);
        emit Sale(bid.bidder, msg.sender, bid.price, _erc721, _tokenId);
        // Clear out bid and offer
        bid.bidder = payable(address(0));
        bid.price = 0;
        Offer storage offer = offers[_erc721][_tokenId];
        offer.seller = payable(address(0));
        offer.price = 0;
    }

    function removeOffer(address _erc721, uint _tokenId) public {
        require(IERC721(_erc721).ownerOf(_tokenId) == msg.sender, "You do not own this NFT.");
        Offer storage offer = offers[_erc721][_tokenId];
        offer.price = 0;
        offer.seller = payable(address(0));
        emit NewOffer(address(0), 0, _erc721, _tokenId);
    }

    function removeBid(address _erc721, uint _tokenId) public {
        Bid storage bid = bids[_erc721][_tokenId];
        require(bid.bidder == msg.sender, "You are not the bidder.");
        bid.price = 0;
        bid.bidder = payable(address(0));
        emit NewBid(address(0), 0, _erc721, _tokenId);
    }
}