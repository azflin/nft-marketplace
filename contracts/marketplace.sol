// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "hardhat/console.sol";

contract Marketplace {
    struct Offer {
        bool isForSale;
        address seller;
        uint minValue;
    }

    struct Bid {
        uint tokenId;
        address bidder;
        uint value;
    }

    mapping (address => mapping(uint => Offer)) public offers;
    mapping (address => mapping(uint => Bid)) public bids;

    function makeOffer(address erc721, uint tokenId, uint buyNow) public {
        require(IERC721(erc721).ownerOf(tokenId) == msg.sender, "You do not own this NFT.");
        Offer memory offer = Offer(true, msg.sender, buyNow);
        offers[erc721][tokenId] = offer;
    }

    function takeOffer(address erc721, uint tokenId) public payable {
        require(offers[erc721][tokenId].isForSale, "Token not for sale.");
    }
}