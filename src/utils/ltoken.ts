import { Address } from '@graphprotocol/graph-ts'

import { LToken } from '../../generated/templates/LToken/LToken'

export function fetchUnderlying(marketAddress: Address): Address {
  const contract = LToken.bind(marketAddress)
  let underlyingValue = Address.zero()
  const underlyingResult = contract.try_underlying()
  if (!underlyingResult.reverted) {
    underlyingValue = underlyingResult.value
  }
  return underlyingValue
}