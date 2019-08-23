pragma solidity >=0.5.0 <0.6.0;

import "../interface/IArbitrage.sol";
import "./Ownable.sol";


/**
 * @title Arbitrage
 * @dev Arbitrage contract
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
 * AR01: Contract must be active
 * AR02: Dispute must be active
 * AR03: Defendant cannot be null
 * AR04: Message sender must be either the claimant or an arbitrator
 * AR05: Message sender must be either the defendant or an arbitrator
 * AR06: Resolution must match with the resolution hash
 * AR07: Unable to execute contract operation
 * AR08: Arbitrator address cannot be null
*/
contract Arbitrage is IArbitrage, Ownable {

  bool public active = true;
  mapping(address => bool) public arbitrators;

  struct Dispute {
    address claimant;
    address arbitrable;
    address defendant;
    uint256 raisedAt;
    bytes32 resolutionHash;
  }
  mapping(uint256 => Dispute) internal disputes;
  uint256 public disputesCount;

  modifier whenActive() {
    require(active, "AR01");
    _;
  }

  modifier whenDisputeActive(uint256 _disputeId) {
    require(active, "AR01");
    require(disputes[_disputeId].claimant != address(0), "AR02");
    _;
  }

  /**
   * @dev constructor
   */
  constructor(address[] memory _arbitrators) public {
    updateArbitratorsInternal(_arbitrators, true);
  }

  /**
   * @dev dispute claimant
   */
  function disputeClaimant(uint256 _disputeId)
    external view returns (address)
  {
    return disputes[_disputeId].claimant;
  }

  /**
   * @dev dispute arbitrable
   */
  function disputeArbitrable(uint256 _disputeId)
    external view returns (address)
  {
    return disputes[_disputeId].arbitrable;
  }

  /**
   * @dev dispute defendant
   */
  function disputeDefendant(uint256 _disputeId)
    external view returns (address)
  {
    return disputes[_disputeId].defendant;
  }

  /**
   * @dev dispute raised at
   */
  function disputeRaisedAt(uint256 _disputeId)
    external view returns (uint256)
  {
    return disputes[_disputeId].raisedAt;
  }

  /**
   * @dev dispute resolution hash
   */
  function disputeResolutionHash(uint256 _disputeId)
    external view returns (bytes32)
  {
    return disputes[_disputeId].resolutionHash;
  }

  /**
   * @dev disputeStatus
   */
  function disputeStatus(uint256 _disputeId)
    external view returns (DisputeStatus)
  {
    if (disputes[_disputeId].claimant != address(0)) {
      return DisputeStatus.ACTIVE;
    }
    return DisputeStatus.CLOSED;
  }

  /**
   * @dev add third parties
   */
  function addArbitrators(address[] calldata _arbitrators)
    external onlyOwner whenActive
  {
    updateArbitratorsInternal(_arbitrators, true);
  }

  /**
   * @dev remove third parties
   */
  function removeArbitrators(address[] calldata _arbitrators)
    external onlyOwner whenActive
  {
    updateArbitratorsInternal(_arbitrators, false);
  }

  /**
   * @dev repudiate
   */
  function repudiate() public onlyOwner {
    active = false;
  }

  /**
   * @dev raise dispute
   */
  function raiseDispute(
    address _arbitrable,
    address _defendant,
    bytes32 _reasonHash,
    bytes32 _resolutionHash)
    public whenActive returns (uint256)
  {
    require(_defendant != address(0), "AR03");
    Dispute memory dispute = Dispute(
      msg.sender,
      _arbitrable,
      _defendant,
      // solhint-disable-next-line not-rely-on-time
      now,
      _resolutionHash);
    disputes[++disputesCount] = dispute;

    emit DisputeRaised(
      disputesCount,
      _arbitrable,
      msg.sender,
      _defendant,
      _reasonHash);
    return disputesCount;
  }

  /**
   * @dev closing dispute
   */
  function closeDispute(uint256 _disputeId)
    public whenDisputeActive(_disputeId)
  {
    require(
      disputes[_disputeId].claimant == msg.sender || arbitrators[msg.sender],
      "AR04");
    closeDisputeInternal(_disputeId);
  }

  /**
   * @dev suggest dispute resolution
   */
  function suggestDisputeResolution(
    uint256 _disputeId,
    bytes32 _resolutionHash) external whenDisputeActive(_disputeId)
  {
    Dispute storage dispute = disputes[_disputeId];
    require(dispute.claimant == msg.sender || arbitrators[msg.sender], "AR04");

    dispute.resolutionHash = _resolutionHash;
    emit DisputeResolutionSuggested(_disputeId, msg.sender, _resolutionHash);
  }

  /*
   * @dev resolve dispute
   */
  function resolveDispute(uint256 _disputeId, bytes calldata _resolution)
    external whenDisputeActive(_disputeId)
  {
    Dispute storage dispute = disputes[_disputeId];
    require(
      dispute.defendant == msg.sender || arbitrators[msg.sender],
      "AR05");

    if (dispute.arbitrable != address(0) && dispute.resolutionHash != 0) {
      require(keccak256(_resolution) == dispute.resolutionHash, "AR06");
      address contractAddress = address(dispute.arbitrable);
      // solhint-disable-next-line avoid-low-level-calls
      (bool success,) = contractAddress.call(_resolution);
      require(success, "AR07");
    }

    emit DisputeResolved(_disputeId, msg.sender, dispute.resolutionHash);
    closeDisputeInternal(_disputeId);
  }

  /**
   * @dev update many third parties
   * @param _arbitrators arbitrators to update
   * @param _active whether the arbitrators are added or removed
   */
  function updateArbitratorsInternal(address[] memory _arbitrators, bool _active)
    internal
  {
    for (uint256 i = 0; i < _arbitrators.length; i++) {
      require(_arbitrators[i] != address(0), "AR08");
      arbitrators[_arbitrators[i]] = _active;
    }
  }

  /**
   * @dev closing dispute internal
   */
  function closeDisputeInternal(uint256 _disputeId) internal {
    delete disputes[_disputeId];
    emit DisputeClosed(_disputeId, msg.sender);
  }
}
