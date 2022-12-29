// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTGiftExchange {
    address private owner;
    uint256 public totalStakedNFt;
    uint256 public totalLockedTime;
    IERC721 public nftContract;

    struct NftDetails {
        uint256 id;
        address owner;
        bool status;
        uint256 stakedTime;
    }

    mapping(address => NftDetails) public userNftDetails;
    mapping(address => bool) public isStaked;

    NftDetails[] public pendingStakeStatusNft;
    NftDetails[] public successStakeStatusNft;
    uint256[] public userStakedNftTokenId;
    address[] public users;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can access this function");
        _;
    }

    constructor(uint256 _lockedTime, address _nftContract) {
        owner = msg.sender;
        totalLockedTime = block.timestamp + _lockedTime;
        nftContract = IERC721(_nftContract);
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function onERC721Received(
        address operator,
        address,
        uint256,
        bytes calldata
    ) public view returns (bytes4) {
        require(
            operator == address(this),
            "Direct Token transfer is not allowed"
        );
        // dont allow direct token receive
        return this.onERC721Received.selector;
    }

    function stakeNft(uint256 _tokenId) public {
        require(
            nftContract.ownerOf(_tokenId) == msg.sender,
            "You cannot stake the other user NFT"
        );
        require(!isStaked[msg.sender], "Maxium 1NFT per wallet can be staked");
        nftContract.safeTransferFrom(msg.sender, address(this), _tokenId);
        // nftContract.
        totalStakedNFt += 1;
        isStaked[msg.sender] = true;
        userNftDetails[msg.sender] = NftDetails(
            _tokenId,
            msg.sender,
            false,
            block.timestamp
        );
        pendingStakeStatusNft.push(userNftDetails[msg.sender]);
    }

    function approveNft() public onlyOwner {
        NftDetails[] storage pendingApproval = pendingStakeStatusNft;
        for (uint256 i = 0; i < pendingApproval.length; i++) {
            pendingApproval[i].status = true;
            pendingApproval[i].id = pendingApproval[i].id;
            pendingApproval[i].owner = pendingApproval[i].owner;
            pendingApproval[i].stakedTime = pendingApproval[i].stakedTime;
            successStakeStatusNft.push(pendingApproval[i]);
            delete pendingStakeStatusNft[i];
        }
    }

    function distribution() public onlyOwner {
        require(
            block.timestamp > totalLockedTime,
            "You cannot distribute before locktime."
        );
        NftDetails[] storage approvedRequests = successStakeStatusNft;

        for (uint256 i = 0; i < approvedRequests.length; i++) {
            userStakedNftTokenId.push(approvedRequests[i].id);
            users.push(approvedRequests[i].owner);
            // users[i] = approvedRequests[i].owner;
        }

        uint256[] memory suffledToken = _shuffleToken(userStakedNftTokenId);
        // address[] memory shuffledAddress = _shuffleAddress(users);
        for (uint256 i = 0; i < suffledToken.length; i++) {
            // address tokenOriginalOwner = nftContract.ownerOf(suffledToken[i]);
            // NftDetails memory previousDetails = userNftDetails[tokenOriginalOwner];
            nftContract.safeTransferFrom(
                address(this),
                users[i],
                suffledToken[i]
            );
            // userNftDetails[shuffledAddress[i]] = NftDetails(suffledToken[i], msg.sender, false, previousDetails.stakedTime);
        }
    }

    function _shuffleToken(uint256[] memory arrangedArray)
        internal
        view
        returns (uint256[] memory)
    {
        uint256[] memory shuffledArray = arrangedArray;
        uint256 lengthOfArray = shuffledArray.length;
        for (uint256 i = 0; i < lengthOfArray; i++) {
            uint256 n = i +
                (uint256(keccak256(abi.encodePacked(block.timestamp))) %
                    (lengthOfArray - i));
            uint256 temp = shuffledArray[n];
            shuffledArray[n] = shuffledArray[i];
            shuffledArray[i] = temp;
        }
        return shuffledArray;
    }

    function _shuffleAddress(address[] memory arrangedArray)
        internal
        view
        returns (address[] memory)
    {
        address[] memory shuffledArray = arrangedArray;
        uint256 lengthOfArray = shuffledArray.length;
        for (uint256 i = 0; i < lengthOfArray; i++) {
            uint256 n = i +
                (uint256(keccak256(abi.encodePacked(block.timestamp))) %
                    (lengthOfArray - i));
            address temp = shuffledArray[n];
            shuffledArray[n] = shuffledArray[i];
            shuffledArray[i] = temp;
        }
        return shuffledArray;
    }
}
