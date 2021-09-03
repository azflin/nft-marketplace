// contracts/DummyNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity =0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Weth is ERC20 {
    constructor(uint256 initialSupply) ERC20("Wrapped Ethereum", "WETH") {
        _mint(msg.sender, initialSupply);
    }
}