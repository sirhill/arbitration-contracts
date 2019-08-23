pragma solidity >=0.5.0 <0.6.0;


/**
 * @title IRestricableArbitrage
 * @dev IRestricableArbitrage contract
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
interface IRestricableArbitrage {

  function claimants() external view returns (address[] memory);
  function defendant() external view returns (address[] memory);
  function arbitrable() external view returns (address[] memory);

  function restrictClaimants(address[] calldata _claimants) external;
  function restrictDefendants(address[] calldata _defendant) external;
  function restrictArbitrables(address[] calldata _arbitrable) external;

  event ClaimantsRestricable();
  event DefendantsRestricable();
  event ArbitrablesRestricable();
}
