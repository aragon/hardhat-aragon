import { AragonPluginError } from '../../errors'
import { create } from 'ipfs-http-client'

/**
 * Sanity check to check if an IPFS API is active
 * Note: It requires the API to /api/v0/version route available
 */
export async function assertIpfsApiIsAvailable(
  urlArg: string | undefined
): Promise<any> {
  if (!urlArg) {
    throw new AragonPluginError('Missing mandatory ipfs-api-url argument value')
  }

  let url
  try {
    url = new URL(urlArg)
  } catch (e) {
    throw new AragonPluginError(`Invalid IPFS URL: ${urlArg}
The IPFS URL must be of the following format: http(s)://host[:port]/[path]`)
  }

  try {
    const ipfs = create(url)
    await ipfs.version()
    return ipfs
  } catch (e) {
    throw new AragonPluginError(
      `IPFS API at ${url} is not available. Error: ${e}`
    )
  }
}
