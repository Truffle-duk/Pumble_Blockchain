const PBToken = artifacts.require("PBToken");
const EventTokenDistributor = artifacts.require("EventTokenDistributor");

contract("EventTokenDistributor", (accounts) => {
    let tokenInstance;
    let distributorInstance;

    const [owner, participant] = accounts;
    const eventId = 3;
    const maxParticipants = 100;
    const rewardPerParticipant = 2; // 각 사용자에게 지급할 보상 (2 토큰)
    // 총 토큰을 먼저 ETH 단위로 계산한 후, Wei로 변환
    const totalTokensInEth = maxParticipants * rewardPerParticipant;
    const totalTokensInWei = web3.utils.toWei(totalTokensInEth.toString(), "ether");

    before(async () => {
        // PBToken 배포
        tokenInstance = await PBToken.new({ from: owner });

        // EventTokenDistributor 배포, 토큰 주소 전달
        distributorInstance = await EventTokenDistributor.new(tokenInstance.address, { from: owner });
    });

    it("should create an event and mint the correct number of tokens", async () => {
        const BeforeBalance = await tokenInstance.balanceOf(distributorInstance.address);
        console.log("Before: ", BeforeBalance.toString())
        // 이벤트 생성
        await distributorInstance.createEvent(eventId, maxParticipants, rewardPerParticipant, { from: owner });

        // 이벤트 확인
        const hEventId = web3.utils.soliditySha3(eventId);
        const eventInfo = await distributorInstance.events(hEventId);
        assert.equal(eventInfo.id.toNumber(), eventId, "이벤트 ID가 올바르지 않음");
        assert.equal(eventInfo.reward.toString(), rewardPerParticipant.toString(), "보상 금액이 올바르지 않음");
        console.log("MintedToken: ", totalTokensInWei.toString())
        assert.equal(eventInfo.tokens.toString(), totalTokensInEth.toString(), "할당된 토큰이 올바르지 않음");
        assert.equal(eventInfo.status, true, "이벤트 상태가 '진행 중'이어야 함");

        // 토큰 컨트랙트의 잔액 확인 (EventTokenDistributor 컨트랙트가 토큰을 소유하고 있어야 함)
        const distributorBalance = await tokenInstance.balanceOf(distributorInstance.address);
        console.log("MintedToken: ", totalTokensInWei.toString())
        console.log("DistributorBalance: ", distributorBalance.toString())
        assert.equal(distributorBalance.toString(), totalTokensInWei.toString(), "컨트랙트 잔액이 잘못됨");
    });

    it("should distribute tokens to participants", async () => {
        const distributeAmount = web3.utils.toWei(rewardPerParticipant.toString(), "ether");// 참가자에게 줄 토큰 양
        console.log("Reward: ", distributeAmount.toString())
        const groupId = "group1";
        const userId = 1;

        // 토큰 분배 전 컨트랙트의 잔액 확인
        const initialContractBalance = await tokenInstance.balanceOf(distributorInstance.address);

        // 참가자에게 토큰 분배
        const txReceipt = await distributorInstance.distributeTokens(eventId, distributeAmount, groupId, userId, { from: participant });

        // 참가자의 잔액 확인
        const participantBalance = await tokenInstance.balanceOf(participant);
        assert.equal(participantBalance.toString(), distributeAmount.toString(), "참가자에게 토큰이 제대로 분배되지 않음");

        // 토큰 분배 후 컨트랙트의 잔액 확인
        const finalContractBalance = await tokenInstance.balanceOf(distributorInstance.address);

        // 남은 토큰이 정확하게 감소했는지 확인
        const expectedRemaining = web3.utils.toBN(initialContractBalance).sub(web3.utils.toBN(distributeAmount));
        assert.equal(finalContractBalance.toString(), expectedRemaining.toString(), "잔여 토큰이 올바르지 않음");

        // 이벤트 정보 확인 (남은 토큰)
        const hEventId = web3.utils.soliditySha3(eventId);
        const eventInfo = await distributorInstance.events(hEventId);
    });

    it("should end the event and burn remaining tokens", async () => {
        // 소각할 토큰 양을 approve
        const hEventId = web3.utils.soliditySha3(eventId);
        const eventInfo = await distributorInstance.events(hEventId);
        const tokensToBurn = eventInfo.tokens;
        
        const remainingBeforeTokens = await tokenInstance.balanceOf(distributorInstance.address);
        // 행사 종료
        await distributorInstance.eventOver(eventId, remainingBeforeTokens, { from: owner });

        // 이벤트 상태 확인
        const updatedEventInfo = await distributorInstance.events(hEventId);
        assert.equal(updatedEventInfo.status, false, "이벤트가 종료되지 않음");

        // 남은 토큰이 소각되었는지 확인
        const remainingTokens = await tokenInstance.balanceOf(distributorInstance.address);
        assert.equal(remainingTokens.toString(), "0", "남은 토큰이 소각되지 않음");
    });


});
