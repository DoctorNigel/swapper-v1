const {
  AccountAllowanceApproveTransaction,
  PrivateKey,
  ContractId,
} = require("@hashgraph/sdk");
const { expect } = require("chai");

const {
  Network,
  Config,
  Hashgraph,
  SDK: { ContractFunctionParameters, TokenId, AccountId },
} = require("hashgraph-support");

describe("Testing a contract", function () {
  const destinationNetwork = Config.network;
  const client = Network.getNodeNetworkClient(destinationNetwork);
  const hashgraph = Hashgraph(client);

  const contractId = process.env.SWAPPER_CONTRACT_ID;
  const test_account_private_key = PrivateKey.fromString(process.env.CUSTOMER_PRIVATE_KEY);

  const senderAddress = AccountId.fromString(process.env.CUSTOMER_ACCOUNT_ID).toSolidityAddress();
  const receiver = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID).toSolidityAddress();

  const tokenIn = TokenId.fromString(process.env.TOKEN_ID_IN).toSolidityAddress();
  const tokenOut = TokenId.fromString(process.env.TOKEN_ID_OUT).toSolidityAddress();

  if (!contractId) {
    throw Error(
      "SWAPPER_CONTRACT_ID: NOT FOUND IN ENV, deploy with 'make deploy-test CONTRACT=\"ContractName\"' to generate in ENV"
    );
  }

  it("A contract will run a test", async () => {
    // Will run if a contract is Ownable
    const response = await hashgraph.contract.query({
      contractId: contractId,
      method: "owner",
    });

    const accountId = AccountId.fromSolidityAddress(response.getAddress(0));

    expect(accountId.toString()).to.equal(process.env.HEDERA_ACCOUNT_ID);
  });

  it("A contract will return the allowance status for a particular account", async () => {
    // Only needed once for a given contract
    const transaction = new AccountAllowanceApproveTransaction()
      .approveTokenNftAllowanceAllSerials(TokenId.fromString(process.env.TOKEN_ID_IN), AccountId.fromString(process.env.CUSTOMER_ACCOUNT_ID), ContractId.fromString(contractId))
      .approveTokenNftAllowanceAllSerials(TokenId.fromString(process.env.TOKEN_ID_OUT), AccountId.fromString(process.env.HEDERA_ACCOUNT_ID), ContractId.fromString(contractId))
      .freezeWith(client)
    
    // Signature for each account giving the allowance
    const signedTx = await ( await (await transaction.sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY))).sign(test_account_private_key)).execute(client);
    console.log((await signedTx.getReceipt(client)).status)

    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "isApproved",
      params: new ContractFunctionParameters()
        .addAddress(tokenIn)
        .addAddress(senderAddress)
    })
  
    expect(response).to.be.true;
  })
  
  it("A contract can call a swap function with params", async () => {
    
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "swap",
      params: new ContractFunctionParameters()
          .addAddress(tokenIn)
          .addAddress(tokenOut)
          .addAddressArray(
            [senderAddress, senderAddress]
          )
          .addAddressArray(
            [receiver, receiver]
          )
          .addInt64Array([100])
          .addInt64Array([10])
    })
 
    expect(response).to.be.true;
  })

  it("A contract will revert if any of the parameters are either missing or false", async () => {
    
    const response = await hashgraph.contract.call({
      contractId: contractId,
      method: "swap",
      params: new ContractFunctionParameters()
          .addAddress(tokenIn)
          .addAddress(tokenOut)
          .addAddressArray(
            [senderAddress]
          )
          .addAddressArray(
            [receiver, receiver]
          )
          .addInt64Array([93, 94])
          .addInt64Array([3, 4])
    })

    const response2 = await hashgraph.contract.call({
      contractId: contractId,
      method: "swap",
      params: new ContractFunctionParameters()
          .addAddress(tokenIn)
          .addAddress(tokenOut)
          .addAddressArray(
            [senderAddress, senderAddress]
          )
          .addAddressArray(
            [receiver]
          )
          .addInt64Array([93, 94])
          .addInt64Array([3, 4])
    })

    const response3 = await hashgraph.contract.call({
      contractId: contractId,
      method: "swap",
      params: new ContractFunctionParameters()
          .addAddress("0x0000000000000000000000000000000000000000")
          .addAddress(tokenOut)
          .addAddressArray(
            [senderAddress, senderAddress]
          )
          .addAddressArray(
            [receiver, receiver]
          )
          .addInt64Array([93, 94])
          .addInt64Array([3, 4])
    })

    const response4 = await hashgraph.contract.call({
      contractId: contractId,
      method: "swap",
      params: new ContractFunctionParameters()
          .addAddress(tokenIn)
          .addAddress("0x0000000000000000000000000000000000000000")
          .addAddressArray(
            [senderAddress, senderAddress]
          )
          .addAddressArray(
            [receiver, receiver]
          )
          .addInt64Array([93, 94])
          .addInt64Array([3, 4])
    })
 
    expect(response && response2 && response3 && response4 && response5).to.be.false;
  })
});
