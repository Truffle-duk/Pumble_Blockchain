// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./PBToken.sol";
contract PurchaseDetails {
    PBToken public tokenContract;

    constructor(address _addr){
        tokenContract = PBToken(_addr);
    }

    struct PurchaseHistory {
        string groupId;
        string itemId;
        address buyer;
        bool isReceived;
        uint256 timestamp;
    }

    event PurchaseItem(string indexed hGroupId, string indexed hUserId, string indexed hItemId, string groupId, string userId, string itemId, uint256 timestamp);
    event ReceiveItem(string indexed hGroupId, string indexed hUserId, string indexed hItemId, string groupId, string userId, string itemId, uint256 timestamp, bool isReceived);

    mapping(bytes32 => PurchaseHistory) public purchaseHistorys;
    mapping(bytes32 => bool) private purchaseExists;
    //함수1. 상품 구매
    function purchaseItem(string memory _groupId, string memory _userId, string memory _itemId, uint256 _price) public {
        require(tokenContract.allowance(msg.sender, address(this)) >= _price, "Insufficient allowance");
        tokenContract.burnFrom(msg.sender, _price);

        uint256 _timestamp = block.timestamp;
        bytes32 key = keccak256(abi.encodePacked(_groupId, _userId, _timestamp));

        purchaseHistorys[key] = PurchaseHistory({
            groupId: _groupId,
            itemId: _itemId,
            buyer: msg.sender,
            isReceived: false,
            timestamp: _timestamp
        });
        purchaseExists[key] = true;

        emit PurchaseItem(_groupId, _userId, _itemId, _groupId, _userId, _itemId, _timestamp);
    }

    //함수2. 상품 수령
    function receiveItem(string memory _groupId, string memory _userId, uint256 _timestamp) public {
        bytes32 key = keccak256(abi.encodePacked(_groupId, _userId, _timestamp));
        require(purchaseExists[key]=true, "Purchase doesn't exist.");
        require(purchaseHistorys[key].buyer == msg.sender, "Access Denied.");

        purchaseHistorys[key].isReceived = true;

        string memory _itemId = purchaseHistorys[key].itemId;

        emit ReceiveItem(_groupId, _userId, _itemId, _groupId, _userId, _itemId, _timestamp, purchaseHistorys[key].isReceived);
    }
}
