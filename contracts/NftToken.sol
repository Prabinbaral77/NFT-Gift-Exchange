// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GameItem is ERC721URIStorage {
    struct NftDetails {
        uint id;
        uint timestamp;
        address owner;
    }
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    mapping(address => NftDetails) public addressToToken;

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
    {}

    function awardItem(address player, string memory tokenURI)
        public
        returns (uint256)
    {
        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);
        _setTokenURI(newItemId, tokenURI);
        addressToToken[player] = NftDetails(newItemId, block.timestamp, player);
        _tokenIds.increment();
        return newItemId;
    }
}
