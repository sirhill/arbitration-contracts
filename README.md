# Arbitration Contracts

Arbitration smart contracts repository.
It contains components usefull for arbitration.

## The Arbitrage Oracle

The 'Arbitrage' is defined in a dedicated smart contract.
This contract describes the process to resolve eventual disputes. Offchain informations and decisions will be required for the resolution. Hence, effectively acting as an Arbitrator Oracle.

Although it may be used independenty or the underlying processes, the arbitrage is more efficient and much cheaper when used together.
This underlying contrat must follow the guidelines of this framework to be 'Arbitrable'.
It offer the ability to the arbitrage contract to directly enforce all decisions made toward the disputes resoltuion.

## A simple Escrow example

An Escrow is a good 'Arbitrable' example to illustrate the arbitrage contract in a simple usecase.
<Example>

In our escrow, a user A will provide and lock funds to the sole benefit of a user B.
The example does not cover it but we can assume that B made a promise in exchange.
When B promise will be fulfilled, A may accept the release the funds.

However, if A does not want to release the funds, an arbitrator is required to decide whether the deposit should be reverted to A or released to B.

## Arbitrable contracts

Generally speaking, an arbitrable contract is a contract which let arbitrators resolve conflicts.
In order to do that, the contract need to provide some features to arbitrators for the execution of resolutions.

Furthermore, it is desired that the arbitrator examine the disputes in a stable state so that the resolution will still be applicable when the decision will be made. Different approaches may be chosen to do so:
- By design, the contract is automatically stucked when a dispute arise. This is the case when the participants are passive in regard to the contract execution. 
- No participants is willing to execute the smart contracts and some parties will have to raise a dispute to allow the arbitrator to sort it out. For example, this would be the case with an escrow account where the buyer does not want to release the funds in all or partially.
- Contract is 'Pausable'. In this case, Arbitrage contract can interrupt the arbitrable contract if requested by participants or the arbitrator itself. This can be the case for a tokensale. It is also interesting to distinguish the case where the whole contract is paused versus the case where only one context is paused. Depending on the type of disputes it might not be relevant to pause all tokensale investor payments, but rather precisely pause the disputed payment.

### Pausable interfaces

In order to have an arbitrable contract be paused, it must implements either IPausable, IPausableContext or IPausableAddressContext interface.
IPausable interface is very common and may be found in other repository such a OpenZepellin. It does interrupt all the contract. This might be overkill for a tokensale for example.
IPausableContext and IPausableAddressContext interface propose a neat way to solve this issue by providing a mecanism to only pause the relevant context of the arbitrable contract. The IPausaleContext use the disputeId, the IPausableAddressContext use the claimant address.

In order to support a pausable arbitrable contract, the Arbitrage must implement the IPausableArbitrage contract.

### Restrictable Arbitrage

By default, only arbitrators must be explicitly declared. Any participants may raised a dispute on any arbitrable contracts.
The IRestrictableArbitrage interface allows to restrict to a claimant, a defendant and an arbitable contract list.

### Possible improvements

- Complex arbitrage across multiple contracts. The arbitrage oracle should be able to arbiter multiple contracts separately or altogether as a dispute may arise from inconsistencies between smart contracts.

- Hierarchical arbitrage. It might be desirable for even more efficiency that some arbitrators have only a limited set of responsabilities but process dispustes quicker. Other arbitrators with greater responsability would intervene as a second layer

## Test coverage

To come soon...
#The latest coverage result may be found [here](https://sirhill.github.io/arbitration-contracts/coverage/)

