import { resolveRepoContentUri } from '../apm'

export async function assertUploadContentResolve(
  contentHash: string,
  gateway: string
): Promise<void> {
  try {
    await resolveRepoContentUri(`ipfs:${contentHash}`, {
      ipfsGateway: gateway,
    })
  } catch {
    return
  }
}
