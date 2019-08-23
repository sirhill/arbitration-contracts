"user strict";

/**
 * @author Cyril Lapinte - <cyril.lapinte@openfiz.com>
 *
 * Copyright © 2016 - 2019 Cyril Lapinte - All Rights Reserved
 * This content cannot be used, copied or reproduced in part or in whole
 * without the express and written permission of Cyril Lapinte.
 * Written by *Cyril Lapinte*, <cyril.lapinte@openfiz.com>
 * All matters regarding the intellectual property of this code or software
 * are subjects to Swiss Law without reference to its conflicts of law rules.
 *
 */

const assertRevert = require("../helpers/assertRevert");
const Escrow = artifacts.require("../../contracts/example/Escrow.sol");

contract("Escrow", function (accounts) {
  let escrow;
  let value = web3.utils.toWei("1", "milli");

  beforeEach(async function () {
    escrow = await Escrow.new();
  });

  it("should have no deposit released available for payee", async function () {
    const depositReleased = await escrow.depositReleased(accounts[3]);
    assert.equal(depositReleased, 0, "deposit released");
  });

  it("should have no deposit locked for payee from payer", async function () {
    const depositLocked = await escrow.depositLocked(accounts[3], accounts[1]);
    assert.equal(depositLocked, 0, "deposit locked");
  });

  it("should have an escrow", async function () {
    assert.isNotNull(escrow.address);
  });

  it("should let payer add deposit to a payee", async function () {
    const receipt = await escrow.addDeposit(accounts[3], { from: accounts[1], value: value });
    assert.equal(receipt.logs.length, 1);
    assert.equal(receipt.logs[0].event, "DepositAdded");
    assert.equal(receipt.logs[0].args.payee, accounts[3], "payee");
    assert.equal(receipt.logs[0].args.by, accounts[1], "by");
    assert.equal(receipt.logs[0].args.weiAmount, value, "weiAmount");
  });

  it("should prevent payer add 0 deposit to a payee", async function () {
    await assertRevert(escrow.addDeposit(accounts[3], { from: accounts[1] }));
  });

  it("should prevent payer release 0 deposit to a payee", async function () {
    await assertRevert(escrow.releaseDeposit(accounts[3], 0, { from: accounts[1] }));
  });

  it("should prevent owner force release 0 deposit to a payee", async function () {
    await assertRevert(escrow.forceReleaseDeposit(accounts[3], accounts[1], 0, { from: accounts[0] }));
  });

  it("should prevent owner to revert 0 deposit to a payee", async function () {
    await assertRevert(escrow.revertDeposit(accounts[3], accounts[1], 0, { from: accounts[0] }));
  });

  it("should prevent payee to withdraw 0 deposit", async function () {
    await assertRevert(escrow.withdrawDeposit(accounts[3], { from: accounts[3] }));
  });
 
  describe("With a deposit", async function () {
    beforeEach(async function () {
      await escrow.addDeposit(accounts[3], { from: accounts[1], value: value });
    });

    it("should have no deposit released available for payee", async function () {
      const depositReleased = await escrow.depositReleased(accounts[3]);
      assert.equal(depositReleased, 0, "deposit released");
    });

    it("should have deposit locked for payee from payer", async function () {
      const depositLocked = await escrow.depositLocked(accounts[3], accounts[1]);
      assert.equal(depositLocked, value, "deposit locked");
    });

    it("should let payer release half deposits to a payee", async function () {
      const receipt = await escrow.releaseDeposit(accounts[3], value / 2, { from: accounts[1] });
      assert.equal(receipt.logs.length, 1);
      assert.equal(receipt.logs[0].event, "DepositReleased");
      assert.equal(receipt.logs[0].args.payee, accounts[3], "payee");
      assert.equal(receipt.logs[0].args.from, accounts[1], "from");
      assert.equal(receipt.logs[0].args.weiAmount, value / 2, "weiAmount");
    });

    it("should let payer release all deposits to a payee", async function () {
      const receipt = await escrow.releaseDeposit(accounts[3], value, { from: accounts[1] });
      assert.equal(receipt.logs.length, 1);
      assert.equal(receipt.logs[0].event, "DepositReleased");
      assert.equal(receipt.logs[0].args.payee, accounts[3], "payee");
      assert.equal(receipt.logs[0].args.from, accounts[1], "from");
      assert.equal(receipt.logs[0].args.weiAmount, value, "value");
    });

    it("should let owner force release half deposits to a payee", async function () {
      const receipt = await escrow.forceReleaseDeposit(accounts[3], accounts[1], value / 2, { from: accounts[0] });
      assert.equal(receipt.logs.length, 2);
      assert.equal(receipt.logs[0].event, "DepositReleased");
      assert.equal(receipt.logs[0].args.payee, accounts[3], "payee");
      assert.equal(receipt.logs[0].args.from, accounts[1], "from");
      assert.equal(receipt.logs[0].args.weiAmount, value / 2, "weiAmount");
    });

    it("should let owner force release all deposits to a payee", async function () {
      const receipt = await escrow.forceReleaseDeposit(accounts[3], accounts[1], value, { from: accounts[0] });
      assert.equal(receipt.logs.length, 2);
      assert.equal(receipt.logs[0].event, "DepositReleased");
      assert.equal(receipt.logs[0].args.payee, accounts[3], "payee");
      assert.equal(receipt.logs[0].args.from, accounts[1], "from");
      assert.equal(receipt.logs[0].args.weiAmount, value, "value");
    });

    it("should let owner revert half deposits to a payer", async function () {
      const receipt = await escrow.revertDeposit(accounts[3], accounts[1], value / 2, { from: accounts[0] });
      assert.equal(receipt.logs.length, 2);
      assert.equal(receipt.logs[0].event, "DepositReverted");
      assert.equal(receipt.logs[0].args.payee, accounts[3], "payee");
      assert.equal(receipt.logs[0].args.to, accounts[1], "to");
      assert.equal(receipt.logs[0].args.weiAmount, value / 2, "weiAmount");
    });

    it("should let owner revert all deposits to a payee", async function () {
      const receipt = await escrow.revertDeposit(accounts[3], accounts[1], value, { from: accounts[0] });
      assert.equal(receipt.logs.length, 2);
      assert.equal(receipt.logs[0].event, "DepositReverted");
      assert.equal(receipt.logs[0].args.payee, accounts[3], "payee");
      assert.equal(receipt.logs[0].args.to, accounts[1], "to");
      assert.equal(receipt.logs[0].args.weiAmount, value, "value");
    });

    it("should prevent non owner force release 0 deposit to a payee", async function () {
      await assertRevert(escrow.forceReleaseDeposit(accounts[3], accounts[1], 0, { from: accounts[1] }));
    });

    describe("and deposits released", async function () {
      beforeEach(async function () {
        await escrow.releaseDeposit(accounts[3], value, { from: accounts[1] });
      });

      it("should have some deposits released available for payee", async function () {
        const depositReleased = await escrow.depositReleased(accounts[3]);
        assert.equal(depositReleased, value, "deposit released");
      });

      it("should have some deposits locked for payee from payer", async function () {
        const depositLocked = await escrow.depositLocked(accounts[3], accounts[1]);
        assert.equal(depositLocked, 0, "deposit locked");
      });

      it("should let payee withdraw", async function () {
        const receipt = await escrow.withdrawDeposit(accounts[3], { from: accounts[3] });
        assert.equal(receipt.logs.length, 1);
        assert.equal(receipt.logs[0].event, "DepositWithdrawn");
        assert.equal(receipt.logs[0].args.payee, accounts[3], "payee");
        assert.equal(receipt.logs[0].args.weiAmount, value, "value");
      });
    });
  });
});
