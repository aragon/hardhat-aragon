import { utils } from 'ethers'

/**
 * Returns the ENS namehash of a domain
 * @param name
 */
export const namehash = (name: string): string => utils.namehash(name)
