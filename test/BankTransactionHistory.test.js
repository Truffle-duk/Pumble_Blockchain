const BankTransactionHistory = artifacts.require("BankTransactionHistory");

contract("BankTransactionHistory", (accounts) => {
    let contractInstance;

    // 각 테스트 실행 전 계약을 배포
    beforeEach(async () => {
        contractInstance = await BankTransactionHistory.new();
    });

    it("should create a group successfully", async () => {
        const groupId = "group1";
        const groupName = "Test Group";

        // 모임 생성
        await contractInstance.createGroup(groupId, groupName, { from: accounts[0] });

        // 모임이 생성되었는지 확인
        const group = await contractInstance.groups(web3.utils.keccak256(groupId));
        assert.equal(group.id, groupId, "Group ID mismatch");
        assert.equal(group.name, groupName, "Group name mismatch");
        assert.equal(group.balance.toNumber(), 0, "Group balance should be zero");
    });

    it("should record a deposit successfully", async () => {
        const groupId = "group1";
        const groupName = "Test Group";
        const depositAmount = 100;
        const counterparty = "Alice";
        const description = "Test deposit";

        // 모임 생성
        await contractInstance.createGroup(groupId, groupName, { from: accounts[0] });

        // 입금 기록
        await contractInstance.recordDeposit(groupId, depositAmount, counterparty, description, { from: accounts[0] });

        // 모임 잔액 확인
        const group = await contractInstance.groups(web3.utils.keccak256(groupId));
        assert.equal(group.balance.toNumber(), depositAmount, "Group balance mismatch");

        // 거래 기록 확인
        const transaction = await contractInstance.transactions(web3.utils.keccak256(groupId), 0);
        assert.equal(transaction.amount.toNumber(), depositAmount, "Deposit amount mismatch");
        assert.equal(transaction.isDeposit, true, "Transaction type should be deposit");
        assert.equal(transaction.counterparty, counterparty, "Counterparty mismatch");
        assert.equal(transaction.description, description, "Description mismatch");
    });

    it("should record a withdrawal successfully", async () => {
        const groupId = "group1";
        const groupName = "Test Group";
        const depositAmount = 100;
        const withdrawalAmount = 50;
        const counterparty = "Bob";
        const description = "Test withdrawal";

        // 모임 생성
        await contractInstance.createGroup(groupId, groupName, { from: accounts[0] });

        // 입금 기록
        await contractInstance.recordDeposit(groupId, depositAmount, "Alice", "Initial deposit", { from: accounts[0] });

        // 출금 기록
        await contractInstance.recordWithdrawal(groupId, withdrawalAmount, counterparty, description, { from: accounts[0] });

        // 모임 잔액 확인
        const group = await contractInstance.groups(web3.utils.keccak256(groupId));
        assert.equal(group.balance.toNumber(), depositAmount - withdrawalAmount, "Group balance mismatch after withdrawal");

        // 거래 기록 확인 (두 번째 거래가 출금이어야 함)
        const transaction = await contractInstance.transactions(web3.utils.keccak256(groupId), 1);
        assert.equal(transaction.amount.toNumber(), withdrawalAmount, "Withdrawal amount mismatch");
        assert.equal(transaction.isDeposit, false, "Transaction type should be withdrawal");
        assert.equal(transaction.counterparty, counterparty, "Counterparty mismatch");
        assert.equal(transaction.description, description, "Description mismatch");
    });

    it("should record a deposit and update receipt details using the transaction index", async () => {
        const groupId = "group1";
        const groupName = "Test Group";
        const depositAmount = 100;
        const counterparty = "Alice";
        const description = "Test deposit";
        const receiptDetails = "Receipt #12345";

        // 1. 모임 생성
        await contractInstance.createGroup(groupId, groupName, { from: accounts[0] });

        // 2. 입금 기록하고 이벤트에서 트랜잭션 인덱스를 확인
        const depositTx = await contractInstance.recordDeposit(groupId, depositAmount, counterparty, description, { from: accounts[0] });

        // 3. 이벤트에서 트랜잭션 인덱스를 추출
        const transactionIndex = depositTx.logs[0].args.transactionIndex.toNumber();
        console.log("Transaction Index:", transactionIndex);

        // 4. 추출한 인덱스를 사용하여 영수증 세부 사항 업데이트
        await contractInstance.updateReceiptDetails(groupId, transactionIndex, receiptDetails, { from: accounts[0] });

        // 5. 거래 내역 확인
        const transaction = await contractInstance.transactions(web3.utils.keccak256(groupId), transactionIndex);
        assert.equal(transaction.receiptDetails, receiptDetails, "Receipt details mismatch");
    });
});