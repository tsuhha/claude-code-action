import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { computeFileSHA } from "../src/github/data/fetcher";

describe("computeFileSHA", () => {
  let workDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    workDir = mkdtempSync(join(tmpdir(), "fetcher-test-"));
    process.chdir(workDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(workDir, { recursive: true, force: true });
  });

  test("computes git blob SHA for a regular file", () => {
    writeFileSync(join(workDir, "hello.txt"), "hello\n");
    expect(computeFileSHA("hello.txt")).toBe(
      "ce013625030ba8dba906f756967f9e9ca394464a",
    );
  });

  test("does not execute shell syntax embedded in file paths", () => {
    const marker = join(workDir, "pwned");
    const maliciousPaths = [
      `$(touch ${marker})`,
      `\`touch ${marker}\``,
      `"; touch ${marker}; echo "`,
    ];

    for (const path of maliciousPaths) {
      expect(() => computeFileSHA(path)).toThrow();
      expect(existsSync(marker)).toBe(false);
    }
  });

  test("hashes files whose names contain shell metacharacters", () => {
    const name = "$(touch pwned)";
    writeFileSync(join(workDir, name), "hello\n");
    expect(computeFileSHA(name)).toBe(
      "ce013625030ba8dba906f756967f9e9ca394464a",
    );
    expect(existsSync(join(workDir, "pwned"))).toBe(false);
  });

  test("treats paths starting with a dash as file names, not options", () => {
    writeFileSync(join(workDir, "--stdin"), "hello\n");
    expect(computeFileSHA("--stdin")).toBe(
      "ce013625030ba8dba906f756967f9e9ca394464a",
    );
  });
});
