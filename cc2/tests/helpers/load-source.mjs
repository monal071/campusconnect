import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
const require = createRequire(import.meta.url);
const ts = require("typescript");
export function sourceLoader(mocks = {}) {
  const cache = new Map();
  return function load(filename) {
    filename = path.resolve(filename);
    if (!path.extname(filename)) filename += existsSync(filename + ".js") ? ".js" : ".ts";
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    const localRequire = specifier => {
      if (specifier in mocks) return mocks[specifier];
      if (specifier.includes("auth/[...nextauth]") || specifier === "./[...nextauth]") return { authOptions: {} };
      if (specifier.endsWith("utils/mongodb") && mocks.databaseModule) return mocks.databaseModule;
      if (specifier.endsWith("lib/redis")) return { invalidateCache: { events: async () => {} }, cache: { get: async () => null, set: async () => {} }, cacheKeys: { events: () => "events" }, cacheTTL: {} };
      return specifier.startsWith(".") ? load(path.resolve(path.dirname(filename), specifier)) : require(specifier);
    };
    vm.runInThisContext("(function(require, module, exports) {" + compiled + "\n})", { filename })(localRequire, module, module.exports);
    return module.exports;
  };
}
