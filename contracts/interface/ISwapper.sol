// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20;

interface ISwapper {
    error SwapFailed();

    error MissingAllowance();

    error AddressLengthsMismatch();
    
    error TokenIdError();

    error SerialArrayEmpty();

    event SwapSuccess(address token, address indexed sender, address indexed receiver, int64[] serials);

    function swap(address tokenIn,
        address tokenOut,
        address[] memory sender,
        address[] memory receiver,
        int64[] memory serialsIn,
        int64[] memory serialsOut) external returns (int32);
}
