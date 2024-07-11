// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract BankTransactionHistory{
    event TransactionCreated(string indexed hGroupId, string groupId, uint256 transactionIndex, bool isDeposit, uint256 amount, string counterparty, string description, uint256 timestamp, string receiptDetails);
    event RetrieveBalance(string indexed hGroupId, string groupId, uint256 balance);

    struct Transaction {
        uint256 amount;
        bool isDeposit; // true for deposit(+), false for withdrawal(-)
        string counterparty;
        string description;
        uint256 timestamp;
        string receiptDetails;
    }

    //모임 구조체
    struct Group {
        string id;
        string name;
        uint256 balance; // 모임의 현재 잔액을 추적
    }

    mapping(bytes32 => Group) public groups;
    mapping(bytes32 => bool) private groupExists;
    mapping(bytes32 => Transaction[]) public transactions; // 각 모임 ID에 대한 입출금 내역


    //함수1: 모임 생성
    function createGroup(string memory _groupId, string memory _name) public {
        bytes32 uuidHash = keccak256(abi.encodePacked(_groupId));
        require(!groupExists[uuidHash], "group already exists."); // 중복 체크
        groups[uuidHash] = Group({
            id: _groupId,
            name: _name,
            balance:0
        });
        groupExists[uuidHash]=true;
    }

    //함수2: 식별자와 입출금 내역을 받아서 기록하는 함수, 입출금 분리 (외부 호출이 있으므로 퍼블릭)
    // 입금 기록
    function recordDeposit(string memory _groupId, uint256 _amount, string memory _counterparty, string memory _description) public {
        bytes32 uuidHash = keccak256(abi.encodePacked(_groupId));
        require(groupExists[uuidHash], "group does not exist.");

        groups[uuidHash].balance += _amount;
        transactions[uuidHash].push(Transaction({
            amount: _amount,
            isDeposit: true,
            counterparty: _counterparty,
            description: _description,
            timestamp: block.timestamp,
            receiptDetails:""
        }));

        emit TransactionCreated(_groupId, _groupId, transactions[uuidHash].length - 1, true, _amount, _counterparty, _description, block.timestamp, "");
        emit RetrieveBalance(_groupId, _groupId, groups[uuidHash].balance);
    }

    // 출금 기록
    function recordWithdrawal(string memory _groupId, uint256 _amount, string memory _counterparty, string memory _description) public {
        bytes32 uuidHash = keccak256(abi.encodePacked(_groupId));
        require(groupExists[uuidHash], "group does not exist.");

        groups[uuidHash].balance -= _amount;
        transactions[uuidHash].push(Transaction({
            amount: _amount,
            isDeposit: false,
            counterparty: _counterparty,
            description: _description,
            timestamp: block.timestamp,
            receiptDetails:""
        }));

        emit TransactionCreated(_groupId, _groupId, transactions[uuidHash].length - 1, false, _amount, _counterparty, _description, block.timestamp, "");
        emit RetrieveBalance(_groupId, _groupId, groups[uuidHash].balance);
    }

    // 영수증 세부 항목 업데이트
    function updateReceiptDetails(string memory _groupId, uint256 _transactionIndex, string memory _receiptDetails) public {
        bytes32 uuidHash = keccak256(abi.encodePacked(_groupId));
        require(groupExists[uuidHash], "group does not exist.");
        require(_transactionIndex < transactions[uuidHash].length, "Transaction does not exist."); // 거래 인덱스 유효성 확인

        Transaction storage transactionToUpdate = transactions[uuidHash][_transactionIndex];
        transactionToUpdate.receiptDetails = _receiptDetails;

        emit TransactionCreated(_groupId, _groupId, _transactionIndex, transactionToUpdate.isDeposit, transactionToUpdate.amount, transactionToUpdate.counterparty, transactionToUpdate.description, block.timestamp, _receiptDetails);
    }

}