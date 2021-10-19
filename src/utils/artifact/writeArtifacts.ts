import path from 'path'

import { ARTIFACT_NAME, FLAT_CODE_NAME, MANIFEST_NAME } from '../../constants'
import { RepoContent } from '../../types'
import { ensureDir, writeFile, writeJson } from '../fsUtils'

export function writeArtifacts(outPath: string, content: RepoContent): void {
  ensureDir(outPath)
  writeJson(path.join(outPath, ARTIFACT_NAME), content.artifact)
  writeJson(path.join(outPath, MANIFEST_NAME), content.manifest)
  writeFile(path.join(outPath, FLAT_CODE_NAME), content.flatCode)
}
