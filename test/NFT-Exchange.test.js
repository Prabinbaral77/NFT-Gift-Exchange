const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require("@openzeppelin/test-helpers");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("NFT-Exchange", () => {
  let tokenURI = "";
  const PREFIX =
    "VM Exception while processing transaction: reverted with reason string";
  beforeEach(async () => {
    [admin, account1, account2, account3, account4] = await ethers.getSigners();
    NFTTokenContract = await ethers.getContractFactory("GameItem");
    nftTokenContract = await NFTTokenContract.deploy("TOKLA", "TKLA");
    await nftTokenContract.deployed();
    // console.log("Nft contract deployed at address: ", nftTokenContract.address);

    NFTGiftExchangeContract = await ethers.getContractFactory(
      "NFTGiftExchange"
    );
    nftGiftExchangeContract = await NFTGiftExchangeContract.deploy(
      10,
      nftTokenContract.address
    );
    await nftGiftExchangeContract.deployed();

    // console.log(
    //   "NFTGiftExchangeContract deployed at address:",
    //   nftGiftExchangeContract.address
    // );
  });

  it("Should set the non zero locked time", async () => {
    expect(
      await nftGiftExchangeContract.connect(account1).totalLockedTime()
    ).not.to.be.equal(0);
  });

  it("User can mint their Nft before transfer", async () => {
    await nftTokenContract.connect(admin).awardItem(account1.address, tokenURI);
    let balance = await nftTokenContract.balanceOf(account1.address);
    expect(balance).to.equal(1);
  });

  it("User can stake their NFT for NFTGiftExchange", async () => {
    await nftTokenContract.connect(admin).awardItem(account1.address, tokenURI);
    let nftDetails1 = await nftTokenContract.addressToToken(account1.address);
    await nftTokenContract
      .connect(account1)
      .approve(nftGiftExchangeContract.address, nftDetails1.id);
    await nftGiftExchangeContract.connect(account1).stakeNft(nftDetails1.id);
    let totalStakedNft = await nftGiftExchangeContract.totalStakedNFt();
    expect(totalStakedNft).to.equal(1);
  });

  it("Multiple User can stake their NFT for NFTGiftExchange", async () => {
    await nftTokenContract.connect(admin).awardItem(account1.address, tokenURI);
    let nftDetails1 = await nftTokenContract.addressToToken(account1.address);
    await nftTokenContract
      .connect(account1)
      .approve(nftGiftExchangeContract.address, nftDetails1.id);
    await nftGiftExchangeContract.connect(account1).stakeNft(nftDetails1.id);

    await nftTokenContract.connect(admin).awardItem(account2.address, tokenURI);
    let nftDetails2 = await nftTokenContract.addressToToken(account2.address);
    await nftTokenContract
      .connect(account2)
      .approve(nftGiftExchangeContract.address, nftDetails2.id);
    await nftGiftExchangeContract.connect(account2).stakeNft(nftDetails2.id);

    await nftTokenContract.connect(admin).awardItem(account3.address, tokenURI);
    let nftDetails3 = await nftTokenContract.addressToToken(account3.address);
    await nftTokenContract
      .connect(account3)
      .approve(nftGiftExchangeContract.address, nftDetails3.id);
    await nftGiftExchangeContract.connect(account3).stakeNft(nftDetails3.id);
    let totalStakedNft = await nftGiftExchangeContract.totalStakedNFt();
    expect(totalStakedNft).to.equal(3);
  });

  it("Stake token in the pending state before approval by owner", async () => {
    await nftTokenContract.connect(admin).awardItem(account1.address, tokenURI);
    let nftDetails1 = await nftTokenContract.addressToToken(account1.address);
    await nftTokenContract
      .connect(account1)
      .approve(nftGiftExchangeContract.address, nftDetails1.id);
    await nftGiftExchangeContract.connect(account1).stakeNft(nftDetails1.id);

    let userNftDetail = await nftGiftExchangeContract
      .connect(account1)
      .userNftDetails(account1.address);
    expect(userNftDetail.status).to.be.equal(false);
  });

  it("Only owner can approve the pending status to approved status", async () => {
    await nftTokenContract.connect(admin).awardItem(account1.address, tokenURI);
    let nftDetails1 = await nftTokenContract.addressToToken(account1.address);
    await nftTokenContract
      .connect(account1)
      .approve(nftGiftExchangeContract.address, nftDetails1.id);
    await nftGiftExchangeContract.connect(account1).stakeNft(nftDetails1.id);
    let userNftDetail = await nftGiftExchangeContract
      .connect(account1)
      .userNftDetails(account1.address);
    expect(userNftDetail.status).to.be.equal(false);

    await nftGiftExchangeContract.connect(admin).approveNft();
    let approvedNftDetails =
      await nftGiftExchangeContract.successStakeStatusNft(0);
    expect(approvedNftDetails.status).to.be.equal(true);
  });

  it("Should distribute the random NFT across the approved users", async () => {
    await nftTokenContract.connect(admin).awardItem(account1.address, tokenURI);
    let nftDetails1 = await nftTokenContract.addressToToken(account1.address);
    let token0PreviousOwner = await nftDetails1.owner;
    await nftTokenContract
      .connect(account1)
      .approve(nftGiftExchangeContract.address, nftDetails1.id);
    await nftGiftExchangeContract.connect(account1).stakeNft(nftDetails1.id);

    await nftTokenContract.connect(admin).awardItem(account2.address, tokenURI);
    let nftDetails2 = await nftTokenContract.addressToToken(account2.address);
    let token1PreviousOwner = await nftDetails2.owner;
    await nftTokenContract
      .connect(account2)
      .approve(nftGiftExchangeContract.address, nftDetails2.id);
    await nftGiftExchangeContract.connect(account2).stakeNft(nftDetails2.id);

    await nftTokenContract.connect(admin).awardItem(account3.address, tokenURI);
    let nftDetails3 = await nftTokenContract.addressToToken(account3.address);
    let token2PreviousOwner = await nftDetails3.owner;
    await nftTokenContract
      .connect(account3)
      .approve(nftGiftExchangeContract.address, nftDetails3.id);
    await nftGiftExchangeContract.connect(account3).stakeNft(nftDetails3.id);

    await nftTokenContract.connect(admin).awardItem(account4.address, tokenURI);
    let nftDetails4 = await nftTokenContract.addressToToken(account4.address);
    let token3PreviousOwner = await nftDetails4.owner;
    await nftTokenContract
      .connect(account4)
      .approve(nftGiftExchangeContract.address, nftDetails4.id);
    await nftGiftExchangeContract.connect(account4).stakeNft(nftDetails4.id);

    await nftGiftExchangeContract.connect(admin).approveNft();
    await nftGiftExchangeContract.connect(admin).distribution();

    let token0OwnerAfterDistribution = await nftTokenContract.ownerOf(0);
    let token1OwnerAfterDistribution = await nftTokenContract.ownerOf(1);
    let token2OwnerAfterDistribution = await nftTokenContract.ownerOf(2);
    let token3OwnerAfterDistribution = await nftTokenContract.ownerOf(3);

    expect(token0PreviousOwner).to.not.equal(token0OwnerAfterDistribution);
    expect(token1PreviousOwner).to.not.equal(token1OwnerAfterDistribution);
    expect(token2PreviousOwner).to.not.equal(token2OwnerAfterDistribution);
    expect(token3PreviousOwner).to.not.equal(token3OwnerAfterDistribution);
  });
});

// Member "push" is not available in uint256[] memory outside of storage.solidity(4994)
// Member "push" is not available in uint256[] memory outside of storage.
