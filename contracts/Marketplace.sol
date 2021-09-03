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

    address public weth;
    mapping (address => mapping(uint => Offer)) public offers;
    mapping (address => mapping(uint => Bid)) public bids;

    event NewBid(address indexed bidder, uint price, address indexed erc721, uint tokenId);
    event NewOffer(address indexed seller, uint price, address indexed erc721, uint tokenId);
    event Sale(address indexed bidder, address indexed seller, uint price, address indexed erc721, uint tokenId);

    constructor(address _weth) public {
        weth = _weth;
    }

    function makeOffer(address _erc721, uint _tokenId, uint _price) public {
        require(IERC721(_erc721).ownerOf(_tokenId) == msg.sender, "You do not own this NFT.");
        require(_price > 0, "Cannot offer 0.");
        Offer memory offer = Offer(payable(msg.sender), _price);
        offers[_erc721][_tokenId] = offer;
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
    }

    function makeBid(address _erc721, uint _tokenId, uint _bid) public {
        require(IERC721(_erc721).ownerOf(_tokenId) != msg.sender, "You cannot bid on your own NFT.");
    }

    function takeBid(address _erc721, uint _tokenId) public payable {

    }
}