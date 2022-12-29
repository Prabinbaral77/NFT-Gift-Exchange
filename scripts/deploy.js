const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  let NFTTokenContract = await ethers.getContractFactory("GameItem");
  let nftTokenContract = await NFTTokenContract.deploy("TOKLA", "TKLA");
  await nftTokenContract.deployed();
  console.log("Nft contract deployed at address: ", nftTokenContract.address);

  let NFTGiftExchangeContract = await ethers.getContractFactory(
    "NFTGiftExchange"
  );
  let nftGiftExchangeContract = await NFTGiftExchangeContract.deploy(
    10,
    nftTokenContract.address
  );
  await nftGiftExchangeContract.deployed();

  console.log(
    "NFTGiftExchangeContract deployed at address:",
    nftGiftExchangeContract.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
