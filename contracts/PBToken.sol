// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract PBToken is ERC20, ERC20Burnable {

    constructor() ERC20("PBToken", "PB") {
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount*10**uint(decimals())); // 토큰 발행
    }

}
