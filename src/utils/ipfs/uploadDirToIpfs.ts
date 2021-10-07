import { globSource, CID } from 'ipfs-http-client'

interface IpfsAddResult {
  path: string
  size: number
  cid: CID
}

/**
 * Uploads dist folder to IPFS
 * Applies various ignore patterns:
 * - .ipfsignore
 * - .gitignore
 */
export async function uploadDirToIpfs({
  dirPath,
  ipfs,
  ignore,
  progress,
}: {
  dirPath: string
  ipfs: any
  ignore?: string[]
  progress?: (totalBytes: number) => void
}): Promise<string> {
  const results: IpfsAddResult = await ipfs.add(
    globSource(dirPath, { recursive: true, ignore }),
    { progress }
  )
  return results.cid.toString()
}
