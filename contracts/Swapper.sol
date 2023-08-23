// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

import { console } from "hardhat/console.sol";
import { Ownable } from "./Ownable.sol";
import { ISwapper } from "./interface/ISwapper.sol";
import { SafeHTS } from "./utils/safe-hts-precompile/SafeHTS.sol";
import { SafeViewHTS } from "./utils/safe-hts-precompile/SafeViewHTS.sol";

contract Swapper is ISwapper, Ownable, SafeHTS, SafeViewHTS {

    constructor(address _owner) Ownable(_owner) {}

    function isApproved(address token, address sender) public returns (bool approved) {
        approved = SafeViewHTS.safeIsApprovedForAll(token, sender, address(this));
        return approved;
    }

    function transferNFTs(address token, address[] memory sender, address[] memory receiver, int64[] memory serials) private {
        if (serials.length >= 2) {
            SafeHTS.safeTransferNFTs(token, sender, receiver, serials);
            emit SwapSuccess(token, sender[0], receiver[0], serials);
        } else {
            SafeHTS.safeTransferNFT(token, sender[0], receiver[0], serials[0]);
            emit SwapSuccess(token, receiver[0], sender[0], serials);
        }
    }

    function swap(address tokenIn,
        address tokenOut,
        address[] memory sender,
        address[] memory receiver,
        int64[] memory serialsIn,
        int64[] memory serialsOut) external onlyOwner returns (int32) {
        if (sender.length != receiver.length) revert AddressLengthsMismatch();
        if (tokenIn == address(0) || tokenOut == address(0)) revert TokenIdError();
        if (serialsIn.length == 0) revert SerialArrayEmpty();
        // Make sure the contract has the allowance to transact
        if (!isApproved(tokenIn, sender[0])) revert MissingAllowance();

        // Transfer NFTs to dragmaLABS treasury
        transferNFTs(tokenIn, sender, receiver, serialsIn);

        // Transfer NFTs from dragmaLABS treasury to the initial sender
        transferNFTs(tokenOut, receiver, sender, serialsOut);

        return 22;
    }
}
