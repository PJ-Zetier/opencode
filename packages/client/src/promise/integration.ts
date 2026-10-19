import type { IntegrationInfo } from "./generated/types.js"

// The integration an alias stands in for: `metadata.aliasOf` naming another listed integration.
function aliasTarget(integration: IntegrationInfo, listed: ReadonlySet<string>) {
  const target = integration.metadata?.aliasOf
  return typeof target === "string" && target !== integration.id && listed.has(target) ? target : undefined
}

/**
 * The connect list as people should see it: an integration the server marks as an alias of another (such as OpenCode
 * Go under OpenCode) is hidden, and its saved credentials are listed under the integration it stands in for, so they
 * stay visible and manageable. Its environment connections are left out; the target reads the same variables.
 */
export function foldIntegrationAliases(list: readonly IntegrationInfo[]): IntegrationInfo[] {
  const listed = new Set(list.map((integration) => integration.id))
  const folded = new Map<string, IntegrationInfo["connections"]>()
  for (const integration of list) {
    const target = aliasTarget(integration, listed)
    if (!target) continue
    const credentials = integration.connections.filter((connection) => connection.type === "credential")
    folded.set(target, [...(folded.get(target) ?? []), ...credentials])
  }
  return list.flatMap((integration) => {
    if (aliasTarget(integration, listed)) return []
    const extra = folded.get(integration.id)
    return [extra?.length ? { ...integration, connections: [...integration.connections, ...extra] } : integration]
  })
}

/** The integration to show for `integrationID`: its alias target when it has one, else itself. */
export function resolveIntegrationAlias(list: readonly IntegrationInfo[], integrationID: string) {
  const integration = list.find((item) => item.id === integrationID)
  return (integration && aliasTarget(integration, new Set(list.map((item) => item.id)))) ?? integrationID
}
