import { ethers } from 'ethers'
import { AragonPluginError } from '../../errors'
import semver from 'semver'

import { urlJoin } from '../url'
import { ApmVersion, ApmVersionReturn } from './types'

/**
 * Parses hex string if it's a hex string, otherwise returns it
 * @param hex "0xaa6161" | "hello"
 */
export function toUtf8IfHex(hex: string): string {
  return ethers.utils.isHexString(hex) ? ethers.utils.toUtf8String(hex) : hex
}

/**
 * Parse a raw version response from an APM repo
 */
export function parseApmVersionReturn(res: ApmVersionReturn): ApmVersion {
  return {
    version: res.semanticVersion.join('.'),
    contractAddress: res.contractAddress,
    // toUtf8String(, true) to ignore UTF8 errors parsing and let downstream
    // components identify faulty content URIs
    contentUri: ethers.utils.toUtf8String(res.contentURI),
  }
}

/**
 * Return a semantic version string into the APM version array format
 * @param version "0.2.4"
 */
export function toApmVersionArray(version: string): [number, number, number] {
  const semverObj = semver.parse(version)
  if (!semverObj) throw new AragonPluginError(`Invalid semver ${version}`)
  return [semverObj.major, semverObj.minor, semverObj.patch]
}

/**
 * Clean an IPFS hash of prefixes and suffixes commonly found
 * in both gateway URLs and content URLs
 * @param ipfsDirtyHash
 */
export function stipIpfsPrefix(ipfsDirtyHash: string): string {
  return (
    ipfsDirtyHash
      // Trim ending /ipfs/ tag
      // "site.io:8080//ipfs//" => "site.io:8080"
      .replace(/\/*ipfs\/*$/, '')
      // Trim starting /ipfs/, ipfs: tag
      // "/ipfs/Qm" => "Qm"
      .replace(/^\/*ipfs[/:]*/, '')
  )
}

/**
 * Returns a joined IPFS location given an IPFS gateway and an IPFS path
 * This util makes sure the url is properly joined, and that it contains
 * the "ipfs" route only once, stripping it from the gateway and the location
 * @param ipfsGateway "https://ipfs.io"
 * @param location "Qmzz"
 * @return "https://ipfs.io/ipfs/Qmzz/artifact.json"
 */
export function joinIpfsLocation(
  ipfsGateway: string,
  location: string
): string {
  return urlJoin(stipIpfsPrefix(ipfsGateway), 'ipfs', stipIpfsPrefix(location))
}

/**
 * Return a fetchable URL to get the resources of a contentURI
 * @param contentUri "ipfs:QmaT4Eef..."
 * @param options
 */
export function contentUriToFetchUrl(
  contentUri: string,
  options?: { ipfsGateway?: string }
): string {
  if (!contentUri) throw new AragonPluginError(`contentUri is empty`)
  const [protocol, location] = contentUri.split(/[/:](.+)/)
  switch (protocol) {
    case 'http':
    case 'https':
      if (!location)
        throw new AragonPluginError(
          `contentUri location not set: ${contentUri}`
        )
      return location.includes('://') ? location : contentUri
    case 'ipfs':
      if (!options || !options.ipfsGateway)
        throw new AragonPluginError(
          `Must provide an ipfsGateway for protocol 'ipfs'`
        )
      return joinIpfsLocation(options.ipfsGateway, location)
    default:
      throw new AragonPluginError(`Protocol '${protocol}' not supported`)
  }
}

/**
 * Returns contentURI in Aragon's protocol:location format as hex
 * @param protocol "ipfs"
 * @param location "QmbNG8dVgi363popKyCrojMNj3wRczxjEoSv27J8tvFgwQ"
 */
export function toContentUri(
  protocol: 'http' | 'https' | 'ipfs',
  location: string
): string {
  if (!protocol)
    throw new AragonPluginError('contentURI protocol must be defined')
  if (!location)
    throw new AragonPluginError('contentURI location must be defined')
  return utf8ToHex([protocol, location].join(':'))
}

/**
 * Returns true if is an address
 * @param address
 */
export function isAddress(address: string): boolean {
  try {
    ethers.utils.getAddress(address)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Return hex format of data with 0x prefix
 * @param data
 */
export function utf8ToHex(data: string): string {
  return '0x' + Buffer.from(data, 'utf8').toString('hex')
}
