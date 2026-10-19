import { describe, expect, test } from "bun:test"
import { foldIntegrationAliases, resolveIntegrationAlias, type IntegrationInfo } from "../src/promise"

const opencode = {
  id: "opencode",
  name: "OpenCode",
  methods: [],
  connections: [{ type: "credential", id: "cred_console", label: "Alpha", method: "oauth" }],
} satisfies IntegrationInfo
const go = {
  id: "opencode-go",
  name: "OpenCode Go",
  metadata: { aliasOf: "opencode" },
  methods: [],
  connections: [
    { type: "credential", id: "cred_go", label: "Go key", method: "key" },
    { type: "env", name: "OPENCODE_API_KEY" },
  ],
} satisfies IntegrationInfo
const anthropic = { id: "anthropic", name: "Anthropic", methods: [], connections: [] } satisfies IntegrationInfo

describe("foldIntegrationAliases", () => {
  test("hides an alias and lists its saved credentials under the integration it stands in for", () => {
    expect(foldIntegrationAliases([go, anthropic, opencode])).toEqual([
      anthropic,
      {
        ...opencode,
        connections: [
          { type: "credential", id: "cred_console", label: "Alpha", method: "oauth" },
          { type: "credential", id: "cred_go", label: "Go key", method: "key" },
        ],
      },
    ])
  })

  test("keeps an alias whose target is not listed", () => {
    expect(foldIntegrationAliases([go, anthropic])).toEqual([go, anthropic])
  })

  test("resolves an alias to its target", () => {
    expect(resolveIntegrationAlias([go, opencode], "opencode-go")).toBe("opencode")
    expect(resolveIntegrationAlias([go, opencode], "opencode")).toBe("opencode")
    expect(resolveIntegrationAlias([go], "opencode-go")).toBe("opencode-go")
  })
})
