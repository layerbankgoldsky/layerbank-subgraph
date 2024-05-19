import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { AccountState, Transaction, Token } from "../../generated/schema";

export function loadAccountState(account: Address, token: Address): AccountState {
  let accountStateID = account.toHex().concat("-").concat(token.toHex());
  let accountState = AccountState.load(accountStateID);

  if (accountState == null) {
    accountState = new AccountState(accountStateID);
    accountState.account = account;
    accountState.token = token;
    accountState.supplied = BigInt.fromI32(0);
    accountState.borrowed = BigInt.fromI32(0);
  }

  return accountState;
}

export function loadTransaction(event: ethereum.Event): Transaction {
  let transactionID = event.transaction.hash.toHex();
  let transaction = Transaction.load(transactionID);

  if (transaction == null) {
    transaction = new Transaction(transactionID);
    transaction.timestamp = event.block.timestamp;
    transaction.blockNumber = event.block.number;
    transaction.save();
  }

  return transaction;
}




