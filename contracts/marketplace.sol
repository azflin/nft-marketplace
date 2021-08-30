// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "hardhat/console.sol";

contract Marketplace {
    struct Offer {
        bool isForSale;
        address payable seller;
        uint price;
    }

    struct Bid {
        uint tokenId;
        address bidder;
        uint value;
    }

    mapping (address => mapping(uint => Offer)) public offers;
    mapping (address => mapping(uint => Bid)) public bids;

    function makeOffer(address erc721, uint tokenId, uint price) public {
        require(IERC721(erc721).ownerOf(tokenId) == msg.sender, "You do not own this NFT.");
        Offer memory offer = Offer(true, payable(msg.sender), price);
        offers[erc721][tokenId] = offer;
    }

    function takeOffer(address erc721, uint tokenId) public payable {
        Offer storage offer = offers[erc721][tokenId];
        require(offer.isForSale, "Token not for sale.");
        require(IERC721(erc721).ownerOf(tokenId) == offer.seller, "Seller no longer owns this NFT.");
        require(msg.value >= offer.price, "Insufficient payment.");
        require(offer.seller != msg.sender, "Cannot take your own offer.");
        (bool success, ) = offer.seller.call{value: msg.value}("");
        require(success, "Transfer was unsuccessful.");
        IERC721(erc721).safeTransferFrom(offer.seller, payable(msg.sender), tokenId);
    }
}