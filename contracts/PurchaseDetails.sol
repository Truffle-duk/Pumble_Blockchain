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
        uint256 itemId;
        address buyer;
        bool isReceived;
        uint256 timestamp;
    }

    event PurchaseItem(string indexed hGroupId, uint256 indexed hUserId, uint256 indexed hItemId, string groupId, uint256 userId, uint256 itemId, uint256 timestamp);
    event ReceiveItem(string indexed hGroupId, uint256 indexed hUserId, uint256 indexed hItemId, string groupId, uint256 userId, uint256 itemId, uint256 timestamp, bool isReceived);

    mapping(bytes32 => PurchaseHistory) public purchaseHistorys;
    mapping(bytes32 => bool) private purchaseExists;
    //함수1. 상품 구매
    function purchaseItem(string memory _groupId, uint256 _userId, uint256 _itemId, uint256 _price) public {
        require(tokenContract.balanceOf(msg.sender)>=_price, "Lack of Balance");

        tokenContract.burn(_price);

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
    function receiveItem(string memory _groupId, uint256 _userId, uint256 _timestamp) public {
        bytes32 key = keccak256(abi.encodePacked(_groupId, _userId, _timestamp));
        require(purchaseExists[key]=true, "Purchase doesn't exist.");
        require(purchaseHistorys[key].buyer == msg.sender, "Access Denied.");

        purchaseHistorys[key].isReceived = true;

        uint256 _itemId = purchaseHistorys[key].itemId;

        emit ReceiveItem(_groupId, _userId, _itemId, _groupId, _userId, _itemId, _timestamp, purchaseHistorys[key].isReceived);
    }
}
