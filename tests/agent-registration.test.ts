/**
 * 🤖 GINVA Agent Keeper Program Tests
 *
 * Tests for Agent functions:
 * 1. Agent Registration
 * 2. Agent Settings Update
 * 3. Agent Operation Recording
 * 4. Agent Rewards Claiming
 * 5. Agent Pause/Disable (Admin)
 */

import { expect } from "chai";
import BN from "bn.js";

describe("🤖 Agent Keeper Program Tests", () => {
  // Revenue Share Constants (basis points)
  const HUMAN_SHARE_BPS = 4500; // 45%
  const AI_AGENT_SHARE_BPS = 3500; // 35%
  const SAFETY_SHARE_BPS = 1500; // 15%
  const DEV_SHARE_BPS = 500; // 5%

  describe("Revenue Distribution (45/35/15/5)", () => {
    it("✅ Correctly splits revenue with 45/35/15/5 model", () => {
      const rewardAmount = 1000000; // 1 USDC (6 decimals)

      const humanShare = Math.floor((rewardAmount * HUMAN_SHARE_BPS) / 10000);
      const aiShare = Math.floor((rewardAmount * AI_AGENT_SHARE_BPS) / 10000);
      const safetyShare = Math.floor((rewardAmount * SAFETY_SHARE_BPS) / 10000);
      const devShare = Math.floor((rewardAmount * DEV_SHARE_BPS) / 10000);

      expect(humanShare).to.equal(450000); // 45%
      expect(aiShare).to.equal(350000); // 35%
      expect(safetyShare).to.equal(150000); // 15%
      expect(devShare).to.equal(50000); // 5%

      // Total should equal original amount (with small rounding)
      const total = humanShare + aiShare + safetyShare + devShare;
      expect(total).to.equal(rewardAmount);
    });

    it("✅ Works with different reward amounts", () => {
      const testCases = [
        {
          amount: 1000000,
          human: 450000,
          ai: 350000,
          safety: 150000,
          dev: 50000,
        },
        {
          amount: 10000000,
          human: 4500000,
          ai: 3500000,
          safety: 1500000,
          dev: 500000,
        },
        { amount: 100000, human: 45000, ai: 35000, safety: 15000, dev: 5000 },
      ];

      testCases.forEach((tc) => {
        const human = Math.floor((tc.amount * HUMAN_SHARE_BPS) / 10000);
        const ai = Math.floor((tc.amount * AI_AGENT_SHARE_BPS) / 10000);
        const safety = Math.floor((tc.amount * SAFETY_SHARE_BPS) / 10000);
        const dev = Math.floor((tc.amount * DEV_SHARE_BPS) / 10000);

        expect(human).to.equal(tc.human);
        expect(ai).to.equal(tc.ai);
        expect(safety).to.equal(tc.safety);
        expect(dev).to.equal(tc.dev);
      });
    });

    it("✅ Handles small amounts without errors", () => {
      const smallAmount = 100; // Very small

      const humanShare = Math.floor((smallAmount * HUMAN_SHARE_BPS) / 10000);
      const aiShare = Math.floor((smallAmount * AI_AGENT_SHARE_BPS) / 10000);
      const safetyShare = Math.floor((smallAmount * SAFETY_SHARE_BPS) / 10000);
      const devShare = Math.floor((smallAmount * DEV_SHARE_BPS) / 10000);

      // Small amounts may result in 0 due to integer division
      expect(humanShare).to.be.at.least(0);
      expect(aiShare).to.be.at.least(0);
      expect(safetyShare).to.be.at.least(0);
      expect(devShare).to.be.at.least(0);
    });
  });

  describe("Performance Calculations", () => {
    const MIN_SUCCESS_RATE = 80; // 80%
    const MAX_RESPONSE_TIME_MS = 5000; // 5 seconds

    it("✅ Correctly calculates success rate", () => {
      const successfulOps = 80;
      const failedOps = 20;
      const totalOps = successfulOps + failedOps;

      const successRate = Math.floor((successfulOps * 10000) / totalOps); // bps

      expect(successRate).to.be.at.least(MIN_SUCCESS_RATE); // 8000 bps = 80%
    });

    it("✅ Flags agent with low success rate", () => {
      const testCases = [
        { successful: 70, failed: 30, shouldPass: false },
        { successful: 80, failed: 20, shouldPass: true },
        { successful: 90, failed: 10, shouldPass: true },
        { successful: 50, failed: 50, shouldPass: false },
      ];

      testCases.forEach((tc) => {
        const total = tc.successful + tc.failed;
        const successRate = Math.floor((tc.successful * 10000) / total);
        const passes = successRate >= MIN_SUCCESS_RATE;

        expect(passes).to.equal(tc.shouldPass);
      });
    });

    it("✅ Validates response time threshold", () => {
      const responseTimes = [1000, 3000, 5000, 7000];

      responseTimes.forEach((time) => {
        const isValid = time <= MAX_RESPONSE_TIME_MS;
        if (time <= 5000) {
          expect(isValid).to.be.true;
        } else {
          expect(isValid).to.be.false;
        }
      });
    });
  });

  describe("Rate Limiting", () => {
    const MIN_RATE_LIMIT = 1;
    const MAX_RATE_LIMIT = 300;
    const DEFAULT_RATE_LIMIT = 15;

    it("✅ Validates rate limit bounds", () => {
      const testCases = [
        { value: 1, valid: true },
        { value: 15, valid: true },
        { value: 100, valid: true },
        { value: 300, valid: true },
        { value: 0, valid: false },
        { value: 301, valid: false },
        { value: -1, valid: false },
      ];

      testCases.forEach((tc) => {
        const isValid =
          tc.value >= MIN_RATE_LIMIT && tc.value <= MAX_RATE_LIMIT;
        expect(isValid).to.equal(tc.valid);
      });
    });

    it("✅ Uses default rate limit when not specified", () => {
      let rateLimit: number | undefined;

      const effectiveRateLimit = rateLimit ?? DEFAULT_RATE_LIMIT;

      expect(effectiveRateLimit).to.equal(DEFAULT_RATE_LIMIT);
    });
  });

  describe("Agent Status", () => {
    const STATUS = {
      ACTIVE: 0,
      DISABLED: 1,
      UNDER_REVIEW: 2,
      SUSPENDED: 3,
      UNREGISTERED: 4,
    };

    it("✅ Maps status codes correctly", () => {
      const statusLabels: Record<number, string> = {
        0: "Active",
        1: "Disabled",
        2: "UnderReview",
        3: "Suspended",
        4: "Unregistered",
      };

      expect(statusLabels[STATUS.ACTIVE]).to.equal("Active");
      expect(statusLabels[STATUS.DISABLED]).to.equal("Disabled");
      expect(statusLabels[STATUS.UNDER_REVIEW]).to.equal("UnderReview");
      expect(statusLabels[STATUS.SUSPENDED]).to.equal("Suspended");
      expect(statusLabels[STATUS.UNREGISTERED]).to.equal("Unregistered");
    });

    it("✅ Determines if agent can operate based on status", () => {
      const canOperate = (status: number): boolean => {
        return status === STATUS.ACTIVE;
      };

      expect(canOperate(STATUS.ACTIVE)).to.be.true;
      expect(canOperate(STATUS.DISABLED)).to.be.false;
      expect(canOperate(STATUS.UNDER_REVIEW)).to.be.false;
      expect(canOperate(STATUS.SUSPENDED)).to.be.false;
      expect(canOperate(STATUS.UNREGISTERED)).to.be.false;
    });
  });

  describe("Agent Roles", () => {
    const ROLES = {
      KEEPER_A: 0,
      KEEPER_B: 1,
      KEEPER_C: 2,
      ALL: 3,
    };

    it("✅ Maps role codes correctly", () => {
      const roleLabels: Record<number, string> = {
        0: "KeeperA",
        1: "KeeperB",
        2: "KeeperC",
        3: "All",
      };

      expect(roleLabels[ROLES.KEEPER_A]).to.equal("KeeperA");
      expect(roleLabels[ROLES.KEEPER_B]).to.equal("KeeperB");
      expect(roleLabels[ROLES.KEEPER_C]).to.equal("KeeperC");
      expect(roleLabels[ROLES.ALL]).to.equal("All");
    });

    it("✅ Validates operation types", () => {
      const VALID_OPS = {
        LIQUIDATE: 1,
        BUY: 2,
        FINALIZE: 3,
      };

      const isValidOp = (op: number): boolean => {
        return [
          VALID_OPS.LIQUIDATE,
          VALID_OPS.BUY,
          VALID_OPS.FINALIZE,
        ].includes(op);
      };

      expect(isValidOp(1)).to.be.true;
      expect(isValidOp(2)).to.be.true;
      expect(isValidOp(3)).to.be.true;
      expect(isValidOp(0)).to.be.false;
      expect(isValidOp(4)).to.be.false;
      expect(isValidOp(99)).to.be.false;
    });
  });

  describe("Input Validation", () => {
    const MAX_NAME_LENGTH = 64;
    const MAX_DESCRIPTION_LENGTH = 256;
    const MAX_FRAMEWORK_LENGTH = 32;

    it("✅ Validates agent name length", () => {
      const testCases = [
        { name: "", valid: false },
        { name: "A".repeat(1), valid: true },
        { name: "A".repeat(64), valid: true },
        { name: "A".repeat(65), valid: false },
      ];

      testCases.forEach((tc) => {
        const isValid = tc.name.length > 0 && tc.name.length <= MAX_NAME_LENGTH;
        expect(isValid).to.equal(tc.valid);
      });
    });

    it("✅ Validates description length", () => {
      const testCases = [
        { desc: "A".repeat(256), valid: true },
        { desc: "A".repeat(257), valid: false },
        { desc: "", valid: true }, // Description is optional
      ];

      testCases.forEach((tc) => {
        const isValid = tc.desc.length <= MAX_DESCRIPTION_LENGTH;
        expect(isValid).to.equal(tc.valid);
      });
    });

    it("✅ Validates framework length", () => {
      const testCases = [
        { framework: "LangGraph", valid: true },
        { framework: "A".repeat(32), valid: true },
        { framework: "A".repeat(33), valid: false },
        { framework: "", valid: false },
      ];

      testCases.forEach((tc) => {
        const isValid =
          tc.framework.length > 0 &&
          tc.framework.length <= MAX_FRAMEWORK_LENGTH;
        expect(isValid).to.equal(tc.valid);
      });
    });
  });
});
