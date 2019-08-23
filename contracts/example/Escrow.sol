pragma solidity >=0.5.0 <0.6.0;

import "./SafeMath.sol";
import "../implementation/Ownable.sol";


 /**
 * @title Escrow
 * @dev Base escrow contract, holds funds designated for a payee until they
 * withdraw them.
 * @dev Intended usage: This contract (and derived escrow contracts) should be a
 * standalone contract, that only interacts with the contract that instantiated
 * it. That way, it is guaranteed that all Ether will be handled according to
 * the Escrow rules, and there is no need to check for payable functions or
 * transfers in the inheritance tree. The contract that uses the escrow as its
 * payment method should be its primary, and provide public methods redirecting
 * to the escrow's deposit and withdraw.
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
 * ES01: Amount must be positive
 * ES02: Payee must not be address 0
 */
contract Escrow is Ownable {
  using SafeMath for uint256;

  event DepositAdded(
    address indexed payee,
    address indexed by,
    uint256 weiAmount
  );
  event DepositReverted(
    address indexed payee,
    address indexed to,
    uint256 weiAmount
  );
  event DepositReleased(
    address indexed payee,
    address indexed from,
    uint256 weiAmount
  );
  event DepositWithdrawn(address indexed payee, uint256 weiAmount);

  struct Deposit {
    uint256 releasedWei;
    mapping(address => uint256) lockedWei;
  }
  mapping(address => Deposit) private _deposits;

  function depositReleased(address _payee) public view returns (uint256) {
    return _deposits[_payee].releasedWei;
  }

  function depositLocked(address _payee, address _from)
    public view returns (uint256)
  {
    return _deposits[_payee].lockedWei[_from];
  }

  /**
   * @dev Stores the sent amount as credit to be withdrawn.
   * @param _payee The destination address of the funds.
   */
  function addDeposit(address _payee) public payable {
    require(msg.value > 0, "ES01");
    require(_payee != address(0), "ES02");
    uint256 amount = msg.value;
    _deposits[_payee].lockedWei[msg.sender] = _deposits[_payee]
      .lockedWei[msg.sender].add(amount);

    emit DepositAdded(_payee, msg.sender, amount);
  }

  /**
   * @dev Release the funds to the payee
   * @param _payee The destination address of the funds.
   * @param _amount The amount to released to the payee
   */
  function releaseDeposit(address _payee, uint256 _amount)
    public returns (bool)
  {
    require(_amount > 0, "ES01");
    _deposits[_payee].lockedWei[msg.sender] = _deposits[_payee]
      .lockedWei[msg.sender].sub(_amount);
    _deposits[_payee].releasedWei = _deposits[_payee]
      .releasedWei.add(_amount);

    emit DepositReleased(_payee, msg.sender, _amount);
    return true;
  }

  /**
   * @dev Force the release of the funds to the payee
   * @param _payee The destination address of the funds.
   * @param _from The lock owner.
   * @param _amount Amount of funds to be released
   */
  function forceReleaseDeposit(
    address payable _payee,
    address _from,
    uint256 _amount) public onlyOwner returns (bool)
  {
    require(_amount > 0, "ES01");
    _deposits[_payee].lockedWei[_from] = _deposits[_payee]
      .lockedWei[_from].sub(_amount);
    _deposits[_payee].releasedWei = _deposits[_payee]
      .releasedWei.add(_amount);

    emit DepositReleased(_payee, _from, _amount);
    return withdrawDeposit(_payee);
  }

  /**
   * @dev Revert the locked deposit to the lock owner.
   * @param _payee The destination address of the funds.
   * @param _payee The lock owner
   */
  function revertDeposit(address _payee, address payable _to, uint256 _amount)
    public onlyOwner returns (bool)
  {
    require(_amount > 0, "ES01");
    _deposits[_payee].lockedWei[_to] = _deposits[_payee]
      .lockedWei[_to].sub(_amount);
    _deposits[_to].releasedWei = _deposits[_to].releasedWei.add(_amount);

    emit DepositReverted(_payee, _to, _amount);
    return withdrawDeposit(_to);
  }

  /**
   * @dev Withdraw accumulated balance for a payee.
   * @param _payee The address whose funds will be withdrawn and transferred to.
   */
  function withdrawDeposit(address payable _payee) public returns (bool) {
    uint256 amount = _deposits[_payee].releasedWei;
    require(amount > 0, "ES01");

    _deposits[_payee].releasedWei = 0;

    _payee.transfer(amount);
    emit DepositWithdrawn(_payee, amount);
    return true;
  }
}
