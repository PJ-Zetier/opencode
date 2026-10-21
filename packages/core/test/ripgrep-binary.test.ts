import path from "path"
import { describe, expect, test } from "bun:test"
import { Effect } from "effect"
import { FetchHttpClient } from "effect/http"
import { AppNodeBuilder } from "@opencode/core/effect/app-node-builder"
import { RipgrepBinary } from "@opencode/core/ripgrep/binary"
import { Global } from "@opencode/util/global"
import { tmpdir } from "./fixture/tmpdir"
import { refuseNetwork } from "./lib/effect"

describe("RipgrepBinary", () => {
  test("skips the download when OPENCODE_OFFLINE is set and rg is missing", async () => {
    await using tmp = await tmpdir()
    const previous = { path: process.env.PATH, offline: process.env.OPENCODE_OFFLINE }
    // Hide any system rg so resolution reaches the download step.
    process.env.PATH = path.join(tmp.path, "path")
    process.env.OPENCODE_OFFLINE = "1"
    try {
      const violations: string[] = []
      const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const binary = yield* RipgrepBinary.Service
          return yield* binary.filepath
        }).pipe(
          Effect.provide(
            AppNodeBuilder.build(RipgrepBinary.node, [
              Global.node.replace(
                Global.layerWith({
                  cache: tmp.path,
                  bin: path.join(tmp.path, "bin"),
                  state: path.join(tmp.path, "state"),
                }),
              ),
            ]),
          ),
          Effect.provideService(FetchHttpClient.Fetch, refuseNetwork(violations)),
        ),
      )
      expect(exit.toString()).toContain("OPENCODE_OFFLINE")
      expect(violations).toEqual([])
    } finally {
      if (previous.path === undefined) delete process.env.PATH
      else process.env.PATH = previous.path
      if (previous.offline === undefined) delete process.env.OPENCODE_OFFLINE
      else process.env.OPENCODE_OFFLINE = previous.offline
    }
  })
})
