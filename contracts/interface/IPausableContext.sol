pragma solidity >=0.5.0 <0.6.0;


/**
 * @title IPausableContext
 * @dev IPausableContext contract
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
interface IPausableContext {

  function pauseContext(uint256 _contextId) external returns (bool);
  function resumeContext(uint256 _contextId) external returns (bool);

  event ContextPaused(uint256 contextId);
  event ContextResumed(address contextId);
}
