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
const Arbitrage = artifacts.require("../../contracts/implementation/Arbitrage.sol");
const Escrow = artifacts.require("../../contracts/example/Escrow.sol");

const ADDRESS_0 = "0x0000000000000000000000000000000000000000";
// BUG https://github.com/ethereum/web3.js/issues/1961
// const EMPTY_HASH = web3.utils.sha3("");
const EMPTY_HASH = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";

contract("Arbitrage", function (accounts) {
  let arbitrage;

  beforeEach(async function () {
    arbitrage = await Arbitrage.new([ accounts[1], accounts[2] ]);
  });

  it("should have arbitrators", async function () {
    assert.ok(await arbitrage.arbitrators(accounts[1]), "arbitrator0");
    assert.ok(await arbitrage.arbitrators(accounts[2]), "arbitrator1");
    assert.ok(!(await arbitrage.arbitrators(accounts[3])), "not arbitrator2");
  });

  it("should have 0 disputes", async function () {
    const disputesCount = await arbitrage.disputesCount();
    assert.equal(disputesCount.toNumber(), 0, "disputes count");
  });

  it("should be active", async function () {
    const active = await arbitrage.active();
    assert.ok(active, "active");
  });

  it("should let owner add arbitrators", async function () {
    const tx = await arbitrage.addArbitrators([ accounts[3], accounts[4] ]);
    assert.ok(tx.receipt.status, "Status");
    assert.ok(await arbitrage.arbitrators(accounts[3]), "arbitrator3");
    assert.ok(await arbitrage.arbitrators(accounts[4]), "arbitrator4");
  });

  it("should let owner remove arbitrators", async function () {
    const tx = await arbitrage.removeArbitrators([ accounts[1], accounts[3] ]);
    assert.ok(tx.receipt.status, "Status");
    assert.ok(!(await arbitrage.arbitrators(accounts[1])), "arbitrator1");
    assert.ok(!(await arbitrage.arbitrators(accounts[3])), "arbitrator3");
  });

  it("should prevent non owner to add arbitrators", async function () {
    await assertRevert(arbitrage.addArbitrators([ accounts[3], accounts[4] ], { from: accounts[1] }));
  });

  it("should prevent non owner to remove arbitrators", async function () {
    await assertRevert(arbitrage.removeArbitrators([ accounts[3], accounts[4] ], { from: accounts[1] }));
  });

  it("should raised a dispute", async function () {
    let startAt = new Date().getTime();
    const tx = await arbitrage.raiseDispute(
      arbitrage.address,
      accounts[6],
      web3.utils.sha3("Because!"),
      web3.utils.sha3("not enforceable"), {
        from: accounts[5],
      }
    );
    assert.ok(tx.receipt.status, "Status");

    assert.equal(tx.receipt.logs.length, 1);
    assert.equal(tx.receipt.logs[0].event, "DisputeRaised");
    assert.equal(tx.receipt.logs[0].args.disputeId, 1, "disputeId");
    assert.equal(tx.receipt.logs[0].args.arbitrable, arbitrage.address, "arbitrage");
    assert.equal(tx.receipt.logs[0].args.claimant, accounts[5], "claimant");
    assert.equal(tx.receipt.logs[0].args.defendant, accounts[6], "defendant");
    assert.equal(tx.receipt.logs[0].args.reasonHash, web3.utils.sha3("Because!"), "reasonHash");

    assert.equal(await arbitrage.disputesCount(), 1, "disputes count");
    assert.equal(await arbitrage.disputeClaimant(1), accounts[5], "dispute claimant");
    assert.equal(await arbitrage.disputeArbitrable(1), arbitrage.address, "dispute arbitrable");
    assert.equal(await arbitrage.disputeDefendant(1), accounts[6], "dispute defendant");

    assert.ok((await arbitrage.disputeRaisedAt(1) + 1) * 1000 >= startAt, "start at");
    assert.equal(await arbitrage.disputeResolutionHash(1),
      web3.utils.sha3("not enforceable"), "resolution hash");
  });

  describe("with a dispute raised without arbitrable or resolution", function () {
    let claimant = accounts[5];
    let defendant = accounts[6];

    beforeEach(async function () {
      await arbitrage.raiseDispute(
        ADDRESS_0,
        defendant,
        web3.utils.sha3("Because!"),
        EMPTY_HASH,
        { from: claimant });
    });

    it("should let claimmant closes the dispute", async function () {
      const tx = await arbitrage.closeDispute(1, { from: claimant });
      assert.ok(tx.receipt.status, "Status");

      assert.equal(tx.receipt.logs.length, 1);
      assert.equal(tx.receipt.logs[0].event, "DisputeClosed");
      assert.equal(tx.receipt.logs[0].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, claimant, "author");
    });

    it("should let arbitrator closes the dispute", async function () {
      const tx = await arbitrage.closeDispute(1, { from: accounts[1] });
      assert.ok(tx.receipt.status, "Status");

      assert.equal(tx.receipt.logs.length, 1);
      assert.equal(tx.receipt.logs[0].event, "DisputeClosed");
      assert.equal(tx.receipt.logs[0].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, accounts[1], "author");
    });

    it("should not let defendant closes the dispute", async function () {
      await assertRevert(arbitrage.closeDispute(1, { from: defendant }));
    });

    it("should let claimmant suggest a dispute resolution", async function () {
      const hash = web3.utils.sha3("test resolution");
      const tx = await arbitrage.suggestDisputeResolution(1,
        hash, { from: claimant });
      assert.ok(tx.receipt.status, "Status");

      assert.equal(tx.receipt.logs.length, 1);
      assert.equal(tx.receipt.logs[0].event, "DisputeResolutionSuggested");
      assert.equal(tx.receipt.logs[0].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, claimant, "author");
      assert.equal(tx.receipt.logs[0].args.resolutionHash, hash, "resolution hash");
    });

    it("should let arbitrator suggest a dispute resolution", async function () {
      const hash = web3.utils.sha3("test resolution");
      const tx = await arbitrage.suggestDisputeResolution(1, hash, { from: accounts[1] });
      assert.ok(tx.receipt.status, "Status");

      assert.equal(tx.receipt.logs.length, 1);
      assert.equal(tx.receipt.logs[0].event, "DisputeResolutionSuggested");
      assert.equal(tx.receipt.logs[0].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, accounts[1], "author");
      assert.equal(tx.receipt.logs[0].args.resolutionHash, hash, "resolution hash");
    });

    it("should not let defendant suggest dispute resolution", async function () {
      const hash = web3.utils.sha3("test resolution");
      await assertRevert(arbitrage.suggestDisputeResolution(1, hash, { from: defendant }));
    });

    it("should let arbitrator resolves the dispute", async function () {
      const tx = await arbitrage.resolveDispute(1, "0x0", { from: accounts[1] });
      assert.ok(tx.receipt.status, "Status");

      assert.equal(tx.receipt.logs.length, 2);
      assert.equal(tx.receipt.logs[0].event, "DisputeResolved");
      assert.equal(tx.receipt.logs[0].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, accounts[1], "author");
      assert.equal(tx.receipt.logs[0].args.resolutionHash, EMPTY_HASH, "resolution hash");
      assert.equal(tx.receipt.logs[1].event, "DisputeClosed");
      assert.equal(tx.receipt.logs[1].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, accounts[1], "author");
    });

    it("should let defendant resolves the dispute", async function () {
      const tx = await arbitrage.resolveDispute(1, "0x0", { from: defendant });
      assert.ok(tx.receipt.status, "Status");

      assert.equal(tx.receipt.logs.length, 2);
      assert.equal(tx.receipt.logs[0].event, "DisputeResolved");
      assert.equal(tx.receipt.logs[0].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, defendant, "author");
      assert.equal(tx.receipt.logs[0].args.resolutionHash, EMPTY_HASH, "resolution hash");
      assert.equal(tx.receipt.logs[1].event, "DisputeClosed");
      assert.equal(tx.receipt.logs[1].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, defendant, "author");
    });

    it("should not let claimant resolves the dispute", async function () {
      await assertRevert(arbitrage.resolveDispute(1, "0x0", { from: claimant }));
    });

    it("should not let defendant resolves the dispute without the correct resolution", async function () {
      await assertRevert(arbitrage.resolveDispute(1, web3.utils.sha3("incorrect"), { from: claimant }));
    });
  });

  describe("with a dispute raised with an arbitrable", function () {
    let claimant = accounts[5];
    let defendant = accounts[6];
    let escrow, request;
    let value = web3.utils.toWei("1", "ether");

    beforeEach(async function () {
      escrow = await Escrow.new();
      await escrow.transferOwnership(arbitrage.address);
      await escrow.addDeposit(claimant, { from: defendant, value: value });
      request = escrow.contract.methods.forceReleaseDeposit(claimant, defendant, value).encodeABI();
      await arbitrage.raiseDispute(
        escrow.address,
        defendant,
        web3.utils.sha3("Because!"),
        web3.utils.sha3(request), { from: claimant });
    });

    it("should let defendant resolves the dispute", async function () {
      const tx = await arbitrage.resolveDispute(1, request, { from: defendant });
      assert.ok(tx.receipt.status, "Status");

      assert.equal(tx.receipt.logs.length, 2);
      assert.equal(tx.receipt.logs[0].event, "DisputeResolved");
      assert.equal(tx.receipt.logs[0].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[0].args.author, defendant, "author");
      assert.equal(tx.receipt.logs[0].args.resolutionHash, web3.utils.sha3(request), "resolution hash");
      assert.equal(tx.receipt.logs[1].event, "DisputeClosed");
      assert.equal(tx.receipt.logs[1].args.disputeId, 1, "disputeId");
      assert.equal(tx.receipt.logs[1].args.author, defendant, "author");

      const balance = await web3.eth.getBalance(claimant);
      assert.ok(web3.utils.fromWei(balance, "ether") > 100.9, "claimmant balance");
    });
  });
});
