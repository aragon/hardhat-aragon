import path from 'path'
import { AragonPluginError } from '../../errors'

import { ARTIFACT_NAME, FLAT_CODE_NAME, MANIFEST_NAME } from '../../constants'
import { AragonArtifact, AragonManifest } from '../../types'
import { parseContractFunctions } from '../ast'
import { readFile, readJson } from '../fsUtils'

import { findMissingManifestFiles } from './findMissingManifestFiles'
import { matchContractRoles } from './matchContractRoles'

/**
 * Validates a release directory. Throws if there are issues
 * - Make sure contract roles match arapp.json roles
 * - Make sure filepaths in the manifest exist
 */
export function validateArtifacts(
  distPath: string,
  appContractName: string,
  hasFrontend: boolean
): void {
  // Load files straight from the dist directory
  const artifact = readJson<AragonArtifact>(path.join(distPath, ARTIFACT_NAME))
  const manifest = readJson<AragonManifest>(path.join(distPath, MANIFEST_NAME))
  const flatCode = readFile(path.join(distPath, FLAT_CODE_NAME))
  const functions = parseContractFunctions(flatCode, appContractName)

  // Make sure all declared files in the manifest are there
  const missingFiles = findMissingManifestFiles(manifest, distPath, hasFrontend)
  if (missingFiles.length)
    throw new AragonPluginError(
      `
Some files declared in manifest.json are not found in dist dir: ${distPath}
${missingFiles.map((file) => ` - ${file.id}: ${file.path}`).join('\n')}
      
Make sure your app build process includes them in the dist directory on
every run of the designated NPM build script.

If you are sure you want to publish anyway, use the flag "--skip-validation".
`
    )

  // Make sure that the roles in the contract match the ones in arapp.json
  const roleMatchErrors = matchContractRoles(functions, artifact.roles)
  if (roleMatchErrors.length)
    throw new AragonPluginError(
      `
Some contract roles do not match declared roles in arapp.json:
${roleMatchErrors.map((err) => ` - ${err.id}: ${err.message}`).join('\n')}

If you are sure you want to publish anyway, use the flag "--skip-validation".
`
    )
}
