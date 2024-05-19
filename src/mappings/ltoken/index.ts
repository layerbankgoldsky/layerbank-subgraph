

import { loadAccountState , loadTransaction} from "../../utils/utils";
import { Address , Bytes} from "@graphprotocol/graph-ts";
import { Borrow as BorrowEvent, RepayBorrow as RepayBorrowEvent, LiquidateBorrow as LiquidateBorrowEvent, Transfer as TransferEvent } from "../../../generated/templates/LToken/LToken";
import { Borrow, RepayBorrow, Market, Token, Transfer, LiquidateBorrow } from "../../../generated/schema";
import { ONE_BI, ZERO_ADDRESS } from "../../utils/constants";

// Handler for Transfer event(including redeem)
export function handleTransfer(event: TransferEvent): void {
  const marketAddress = event.address
  const market = Market.load(marketAddress.toHexString())
  if (!market) return
  market.txCount = market.txCount.plus(ONE_BI)

  const token = Token.load(market.underlying)
  if (!token) return
 let transaction = loadTransaction(event);
  
  const transferID = transaction.id.concat("-").concat(event.logIndex.toString());
  let transfer = new Transfer(transferID);
  transfer.transaction = Bytes.fromHexString(transaction.id); // Convert transaction.id to Bytes type
  transfer.timestamp = transaction.timestamp;
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.amount = event.params.amount;

  transfer.save();
  market.save();

  if (event.params.from.toHex() !== ZERO_ADDRESS && event.params.from !== event.params.to) {
    let accountStateFrom = loadAccountState(event.params.from, marketAddress);
    accountStateFrom.supplied = accountStateFrom.supplied.minus(event.params.amount);
    accountStateFrom.save();
  }

  if (event.params.to.toHex() !== ZERO_ADDRESS && event.params.from !== event.params.to) {
    let accountStateTo = loadAccountState(event.params.to, marketAddress);
    accountStateTo.supplied = accountStateTo.supplied.plus(event.params.amount);
    accountStateTo.save();
  }
}
// Handler for Borrow event
export function handleBorrow(event: BorrowEvent): void {
  const marketAddress = event.address
  const market = Market.load(marketAddress.toHexString())
  if (!market) return
  market.txCount = market.txCount.plus(ONE_BI)

  const token = Token.load(market.underlying)
  if (!token) return
  let transaction = loadTransaction(event);

  const borrowID = transaction.id.concat("-").concat(event.logIndex.toString());
  let borrow = new Borrow(borrowID);
  borrow.transaction = Bytes.fromHexString(transaction.id);
  borrow.timestamp = transaction.timestamp;
  borrow.account = event.params.account;
  borrow.amount = event.params.ammount;
  borrow.accountBorrow = event.params.accountBorrow;

  borrow.save();
  market.save();

  let accountState = loadAccountState(event.params.account, Address.fromBytes(event.address));
  accountState.borrowed = borrow.accountBorrow;
  accountState.save();
}

// Handler for RepayBorrow event
export function handleRepayBorrow(event: RepayBorrowEvent): void {
  const marketAddress = event.address
  const market = Market.load(marketAddress.toHexString())
  if (!market) return
  market.txCount = market.txCount.plus(ONE_BI)

  const token = Token.load(market.underlying)
  if (!token) return
  let transaction = loadTransaction(event);
  
  const repayBorrowID = transaction.id.concat("-").concat(event.logIndex.toString());
  let repayBorrow = new RepayBorrow(repayBorrowID);
  repayBorrow.transaction = Bytes.fromHexString(transaction.id);
  repayBorrow.timestamp = transaction.timestamp;
  repayBorrow.payer = event.params.payer;
  repayBorrow.borrower = event.params.borrower;
  repayBorrow.amount = event.params.amount;
  repayBorrow.accountBorrow = event.params.accountBorrow;

  repayBorrow.save();
  market.save();

  let accountState = loadAccountState(event.params.borrower, Address.fromBytes(event.address));
  accountState.borrowed = event.params.accountBorrow
  accountState.save();
}

// Handler for LiquidateBorrow event
export function handleLiquidateBorrow(event: LiquidateBorrowEvent): void {
  const marketAddress = event.address
  const market = Market.load(marketAddress.toHexString())
  if (!market) return
  market.txCount = market.txCount.plus(ONE_BI)

  const token = Token.load(market.underlying)
  if (!token) return
  let transaction = loadTransaction(event);
  
  const liquidateBorrowID = transaction.id.concat("-").concat(event.logIndex.toString());
  let liquidateBorrow = new LiquidateBorrow(liquidateBorrowID);
  liquidateBorrow.transaction = Bytes.fromHexString(transaction.id);
  liquidateBorrow.logIndex = event.logIndex;
  liquidateBorrow.timestamp = transaction.timestamp;
  liquidateBorrow.liquidator = event.params.liquidator;
  liquidateBorrow.borrower = event.params.borrower;
  liquidateBorrow.amount = event.params.amount;
  liquidateBorrow.lTokenCollateral = event.params.lTokenCollateral;
  liquidateBorrow.seizeAmount = event.params.seizeAmount;

  liquidateBorrow.save();
  market.save();

  let borrowerState = loadAccountState(event.params.borrower, Address.fromBytes( event.address));
  borrowerState.borrowed = borrowerState.borrowed.minus(event.params.amount);
  borrowerState.save();

  let liquidatorState = loadAccountState(event.params.liquidator, Address.fromBytes( event.params.lTokenCollateral));
  liquidatorState.supplied = liquidatorState.supplied.plus(event.params.seizeAmount);
  liquidatorState.save();
}
