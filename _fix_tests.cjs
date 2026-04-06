const fs = require("fs");

// Fix memory-types.test.ts
let types = fs.readFileSync("packages/core/tests/unit/memory/memory-types.test.ts", "utf-8");
types = types.replace(
  "entry.metadata?.agentId",
  "entry.metadata?.['agentId']"
);
fs.writeFileSync("packages/core/tests/unit/memory/memory-types.test.ts", types);
console.log("Fixed memory-types.test.ts");

// Fix short-term-memory.test.ts
let stm = fs.readFileSync("packages/core/tests/unit/memory/short-term-memory.test.ts", "utf-8");
stm = stm.replace(/result\.entries\[(\d+)\]\.id/g, "result.entries[$1]!.id");
stm = stm.replace(/result\.entries\[(\d+)\]\.namespace/g, "result.entries[$1]!.namespace");
stm = stm.replace(/evicted\[0\]\[0\]\.id/g, "evicted[0]![0]!.id");
stm = stm.replace(/cleared\[0\]\)/g, "cleared[0]!)");
fs.writeFileSync("packages/core/tests/unit/memory/short-term-memory.test.ts", stm);
console.log("Fixed short-term-memory.test.ts");