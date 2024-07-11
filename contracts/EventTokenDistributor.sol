// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "./PBToken.sol";

contract EventTokenDistributor {
    PBToken public tokenContract;

    constructor(address _addr){
        tokenContract = PBToken(_addr);
    }

    struct Event {
        uint256 id;
        uint256 reward;
        uint256 tokens;
        bool status;
    }

    //이벤트
    event EventTokenRecords(string indexed hGroupId, uint256 indexed hTimestamp, uint256 indexed hUserId, uint256 userId, uint256 timestamp, uint256 eventId, uint256 tokenNum);


    mapping(bytes32 => Event) public events;
    mapping(bytes32 => bool) private eventExists;

    //함수1. 이벤트 생성(토큰 개수 제한용)
    function createEvent(uint256 _eventId, uint256 _maxPpl, uint256 _reward) public {
        bytes32 hEventId = keccak256(abi.encodePacked(_eventId));
        uint256 _amount = _maxPpl*_reward;
        require(eventExists[hEventId]=true, "Event already exist");
        events[hEventId] = Event({
            id: _eventId,
            reward : _reward,
            tokens: _amount,
            status : true
        });
        eventExists[hEventId]=true;
        tokenContract.mint(address(this), _amount);
    }

    //함수2. 토큰 지급(행사 참여)
    function distributeTokens(uint256 _eventId, uint256 _amount, string memory _groupId, uint256 _userId) public {
        bytes32 hEventId = keccak256(abi.encodePacked(_eventId));
        require(events[hEventId].tokens > 0, "Max Ppl over");
        require(tokenContract.balanceOf(address(this)) >= _amount, "Insufficient tokens in the contract");
        require(tokenContract.transfer(msg.sender, _amount), "Token transfer failed");

        uint256 eventReward = events[hEventId].reward;
        events[hEventId].tokens -= eventReward;

        emit EventTokenRecords(_groupId, block.timestamp, _userId, _userId, block.timestamp, _eventId, eventReward);
    }

    //함수3. 행사 종료
    function eventOver(uint256 _eventId) public returns (string memory){
        bytes32 hEventId = keccak256(abi.encodePacked(_eventId));
        require(eventExists[hEventId], "Event doesn't exist");

        events[hEventId].status = false;

        if (events[hEventId].tokens > 0) {
            tokenContract.burnFrom(address(this), events[hEventId].tokens);
        }

        return "Event Over Success!";
    }
}
