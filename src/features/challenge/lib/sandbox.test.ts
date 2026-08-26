import { describe, expect, it } from "vitest";
import { runSandboxTests } from "./sandbox";

describe("runSandboxTests", () => {
  it("passes when user code satisfies test assertions", async () => {
    const userCode = `
      function fix(a, b) {
        return a + b;
      }
    `;
    const tests = [
      {
        name: "adds positive numbers",
        testCode: `if (fix(2, 3) !== 5) throw new Error('Expected 5');`,
      },
      {
        name: "adds negative numbers",
        testCode: `if (fix(-1, -2) !== -3) throw new Error('Expected -3');`,
      },
    ];

    const result = await runSandboxTests(userCode, tests);
    expect(result.passed).toBe(true);
    expect(result.passedTests).toBe(2);
    expect(result.totalTests).toBe(2);
    expect(result.testResults[0].passed).toBe(true);
  });

  it("fails when assertion throws", async () => {
    const userCode = `
      function fix(a, b) {
        return a - b;
      }
    `;
    const tests = [
      {
        name: "multiplication test",
        testCode: `if (fix(2, 3) !== 5) throw new Error('Expected 5');`,
      },
    ];

    const result = await runSandboxTests(userCode, tests);
    expect(result.passed).toBe(false);
    expect(result.passedTests).toBe(0);
    expect(result.testResults[0].error).toContain("Expected 5");
  });

  it("terminates on infinite loops with timeout", async () => {
    const userCode = `
      while(true) {}
    `;
    const tests = [
      {
        name: "infinite loop check",
        testCode: "",
      },
    ];

    const result = await runSandboxTests(userCode, tests, 200);
    expect(result.passed).toBe(false);
    expect(result.passedTests).toBe(0);
  });
});
