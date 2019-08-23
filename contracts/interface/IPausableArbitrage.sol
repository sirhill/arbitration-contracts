pragma solidity >=0.5.0 <0.6.0;


/**
 * @title IPausableArbitrage
 * @dev IPausableArbitrage contract
 *
 * @author Cyril Lapinte - <cyril.lapinte@openfiz.com>
 *
 * @notice Copyright © 2016 - 2019 Cyril Lapinte - All Rights Reserved
 * @notice This content cannot be used, copied or reproduced in part or in whole
 * @notice without the express and written permission of Cyril Lapinte.
 * @notice Written by *Cyril Lapinte, <cyril.lapinte@openfiz.com>
 * @notice All matters regarding the intellectual property of this code or software
 * @notice are subjects to Swiss Law without reference to its conflicts of law rules.
 *
 * Error messages
*/
interface IPausableArbitrage {

  enum PauseMode {
    NONE,
    CLAIMANT,
    DEFENDANT,
    ARBITRABLE,
    DISPUTE_ID
  }

  function pause(uint256 _disputeId) external;
  function resume(uint256 _disputeId) external;

  function defineArbitrable(
    address _arbitrable,
    PauseMode _pauseMode) external;

  event DisputePaused(uint256 indexed disputeId, address author);
  event DisputeResumed(uint256 indexed disputeId, address author);
}
