import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { MarketListed } from "../generated/Layerbank/Core";
import { LToken } from "../generated/templates";
import { EventLog, Token, Market } from "../generated/schema";
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
} from "./utils/token";
import { fetchUnderlying } from "./utils/ltoken";

function createEventID(event: ethereum.Event): string {
  return event.block.number
    .toString()
    .concat("-")
    .concat(event.logIndex.toString());
}

export function handleMarketListed(event: MarketListed): void {
  let log = new EventLog(createEventID(event));
  log.eventType = "MarketListed";
  log.lToken = event.params.lToken;
  log.timestamp = event.block.timestamp;
  log.transaction = event.transaction.hash;
  log.save();

  const underlyingAddress = fetchUnderlying(
    Address.fromString(event.params.lToken.toHex())
  );
  let underlying = Token.load(underlyingAddress.toHexString());
  if (underlying === null) {
    underlying = new Token(underlyingAddress.toHexString());
    underlying.symbol = fetchTokenSymbol(underlyingAddress);
    underlying.name = fetchTokenName(underlyingAddress);

    const decimals = fetchTokenDecimals(underlyingAddress);
    if (decimals === null) {
      return;
    }
    underlying.decimals = decimals;
  }

  let market = new Market(event.params.lToken.toHex());

  market.createdAtTimestamp = event.block.timestamp;
  market.createdAtBlockNumber = event.block.number;
  market.txCount = BigInt.fromI32(0);
  market.underlying = underlyingAddress.toHexString();

  // Create a new instance of the LToken template
  LToken.create(event.params.lToken);

  underlying.save();
  market.save();
}
