import { ethers } from 'ethers'
import { keyBy } from 'lodash'

import { AragonArtifact, Dependencies, Role } from '../../types'
import { getAppId } from '../appName'
import { parseContractFunctions } from '../ast'

const abiFallback = {
  payable: true,
  stateMutability: 'payable',
  type: 'fallback',
}

/**
 * Returns aragon artifact.json from app data
 * @param appName "finance" | "finance.aragonpm.eth"
 * @param contractName Target contract name or path: "Finance" | "contracts/Finance.sol"
 * @param roles
 * @param dependencies
 * @param abi
 * @param flatCode Flat code of target contract plus all imports
 */
export function generateAragonArtifact(
  appName: string,
  contractName: string,
  roles: Role[],
  dependencies: Dependencies[],
  abi: ethers.utils.Fragment[],
  flatCode: string
): AragonArtifact {
  const abiBySignature = keyBy(
    new ethers.utils.Interface(abi).functions,
    (functionFragment: ethers.utils.FunctionFragment) =>
      functionFragment.format()
  )
  const contractFunctions = parseContractFunctions(flatCode, contractName, {
    onlyTargetContract: true,
  })

  return {
    // Artifact appears to require the abi of each function
    functions: contractFunctions.map((parsedFn) => ({
      roles: parsedFn.roles.map((role) => role.id),
      notice: parsedFn.notice,
      abi:
        abiBySignature[parsedFn.sig] ||
        (parsedFn.sig === 'fallback()' ? abiFallback : null),
      sig: parsedFn.sig,
    })),

    deprecatedFunctions: {},

    // Artifact appears to require the roleId to have bytes precomputed
    roles: roles.map((role) => ({
      ...role,
      bytes: ethers.utils.id(role.id),
    })),

    dependencies,

    abi,

    // Additional metadata
    flattenedCode: './code.sol',
    appName,
    appId: getAppId(appName),
  }
}
