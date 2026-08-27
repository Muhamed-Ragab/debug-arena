import vm from "node:vm";

export interface HiddenTestSpec {
  description?: string;
  name: string;
  testCode: string;
}

export interface TestResult {
  description?: string;
  durationMs: number;
  error?: string;
  name: string;
  passed: boolean;
}

export interface SandboxExecutionResult {
  error?: string;
  executionTimeMs: number;
  passed: boolean;
  passedTests: number;
  testResults: TestResult[];
  totalTests: number;
}

const noop = () => {
  /* no-op for console in sandbox */
};

/**
 * Runs a user-submitted code snippet against a suite of hidden test cases inside a sandboxed vm context.
 * Times out after `timeoutMs` (default 2000ms) to prevent infinite loops.
 */
export async function runSandboxTests(
  userCode: string,
  tests: HiddenTestSpec[],
  timeoutMs = 2000
): Promise<SandboxExecutionResult> {
  const startTime = Date.now();
  const testResults: TestResult[] = [];

  if (tests.length === 0) {
    return {
      executionTimeMs: Date.now() - startTime,
      passed: true,
      passedTests: 0,
      testResults: [],
      totalTests: 0,
    };
  }

  for (const test of tests) {
    const testStart = Date.now();
    try {
      // Create a fresh isolated sandbox context per test
      const contextObj: Record<string, unknown> = {
        Array,
        Boolean,
        clearInterval,
        clearTimeout,
        console: {
          error: noop,
          info: noop,
          log: noop,
          warn: noop,
        },
        Date,
        Error,
        JSON,
        Map,
        Math,
        Number,
        Object,
        Promise,
        RangeError,
        RegExp,
        Set,
        String,
        setInterval,
        setTimeout,
        TypeError,
      };

      const context = vm.createContext(contextObj);

      // Wrapper script: evaluate user code, then execute the test assertions
      const scriptCode = `
        "use strict";
        (async () => {
          // --- USER CODE ---
          ${userCode}

          // --- TEST ASSERTION ---
          ${test.testCode}
        })()
      `;

      const script = new vm.Script(scriptCode);
      const executionPromise = script.runInContext(context, {
        timeout: timeoutMs,
      }) as Promise<void>;

      // biome-ignore lint/performance/noAwaitInLoops: Tests must run sequentially to avoid state leakage
      await Promise.race([
        executionPromise,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`Test timed out after ${timeoutMs}ms`)),
            timeoutMs
          )
        ),
      ]);

      testResults.push({
        description: test.description,
        durationMs: Date.now() - testStart,
        name: test.name,
        passed: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      testResults.push({
        description: test.description,
        durationMs: Date.now() - testStart,
        error: message,
        name: test.name,
        passed: false,
      });
    }
  }

  const passedTests = testResults.filter((t) => t.passed).length;
  const passed = passedTests === tests.length;

  return {
    executionTimeMs: Date.now() - startTime,
    passed,
    passedTests,
    testResults,
    totalTests: tests.length,
  };
}
