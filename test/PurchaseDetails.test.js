const PBToken = artifacts.require("PBToken");
const PurchaseDetails = artifacts.require("PurchaseDetails");

contract("PurchaseDetails", (accounts) => {
    let tokenInstance;
    let purchaseInstance;

    const [owner, buyer] = accounts;

    before(async () => {
        // PBToken 배포
        tokenInstance = await PBToken.new({ from: owner });
        // PurchaseDetails 배포, 토큰 주소 전달
        purchaseInstance = await PurchaseDetails.new(tokenInstance.address, { from: owner });

        // buyer에게 초기 토큰 발행 (예: 1000 ether)
        const initialSupply = web3.utils.toWei("1000000", "ether");
        await tokenInstance.mint(buyer, initialSupply, { from: owner });  // mint를 사용해 buyer에게 토큰 할당
    });

    it("should allow a user to purchase an item", async () => {
        const groupId = "group1";
        const userId = 1;
        const itemId = 3;
        const price = web3.utils.toWei("1", "ether");

        // 구매 전, 토큰 잔액 확인
        const initialBalance = await tokenInstance.balanceOf(buyer);
        console.log("Initial Balance: ", initialBalance.toString());
        console.log("Price: ", price.toString())

        await tokenInstance.approve(purchaseInstance.address, price, { from: buyer });

        // buyer 계정에서 상품 구매
        const purchaseTx = await purchaseInstance.purchaseItem(groupId, userId, itemId, price, { from: buyer });

        // 이벤트 로그 확인
        const purchaseEvent = purchaseTx.logs[0];
        assert.equal(purchaseEvent.event, "PurchaseItem", "PurchaseItem 이벤트가 발생해야 함");
        assert.equal(purchaseEvent.args.hGroupId, web3.utils.keccak256(groupId), "GroupId가 올바르지 않음");
        assert.equal(purchaseEvent.args.hItemId.toNumber(), itemId, "ItemId가 올바르지 않음");
        assert.equal(purchaseEvent.args.hUserId.toNumber(), userId, "UserId가 올바르지 않음");

        // 구매 후, 잔액 감소 확인
        const finalBalance = await tokenInstance.balanceOf(buyer);
        console.log("FinalBalance: " + finalBalance)
        assert.equal(finalBalance.toString(), initialBalance.sub(web3.utils.toBN(price)).toString(), "토큰 잔액이 올바르게 차감되지 않음");
    });

    it("should allow a user to receive an item", async () => {
        const groupId = "group1";
        const userId = 1;

        // 블록의 timestamp를 사용하여 구매한 항목을 찾습니다
        const latestBlock = await web3.eth.getBlock('latest');
        const timestamp = latestBlock.timestamp;

        // 해시 계산: abi.encodePacked 대신 web3.utils.soliditySha3 사용
        const purchaseKey = web3.utils.soliditySha3(
            { type: 'string', value: groupId },
            { type: 'uint256', value: userId },
            { type: 'uint256', value: timestamp }
        );

        const purchaseHistory = await purchaseInstance.purchaseHistorys(purchaseKey);
        console.log("Purchase History: ", purchaseHistory);

        // 상품 수령
        const receiveTx = await purchaseInstance.receiveItem(groupId, userId, timestamp, { from: buyer });

        // 이벤트 로그 확인
        const receiveEvent = receiveTx.logs[0];
        assert.equal(receiveEvent.event, "ReceiveItem", "ReceiveItem 이벤트가 발생해야 함");
        assert.equal(receiveEvent.args.hGroupId, web3.utils.keccak256(groupId), "GroupId가 올바르지 않음");
        assert.equal(receiveEvent.args.hItemId.toNumber(), purchaseHistory.itemId.toNumber(), "ItemId가 올바르지 않음");
        assert.equal(receiveEvent.args.isReceived, true, "수령 상태가 올바르지 않음");
    });
});