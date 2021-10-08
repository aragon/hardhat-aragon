import path from 'path'
import { extendConfig, task } from 'hardhat/config'
import { HardhatConfig, HardhatUserConfig } from 'hardhat/types'
import * as types from 'hardhat/internal/core/params/argumentTypes'

import {
  DEFAULT_APP_BUILD_PATH,
  DEFAULT_APP_SRC_PATH,
  DEFAULT_IGNORE_PATH,
  DEFAULT_IPFS_API_ENDPOINT,
  DEFAULT_IPFS_GATEWAY,
  DEFAULT_APP_BUILD_SCRIPT,
  DEFAULT_CONFIRMATIONS,
} from './constants'
import { TASK_PUBLISH } from './task-names'

import { publishTask } from './tasks/publish'

// We ommit these imports beacuse they are peer dependencies and will be added
// by the plugin user. Otherwise naming conflicts may araise
// import '@nomiclabs/hardhat-ethers'

// This import is needed to let the TypeScript compiler know that it should include your type
// extensions in your npm package's types file.
import './types/type-extensions'

extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    config.ipfs = {
      url: userConfig.ipfs?.url ?? DEFAULT_IPFS_API_ENDPOINT,
      gateway: userConfig.ipfs?.gateway ?? DEFAULT_IPFS_GATEWAY,
      pinata: userConfig.ipfs?.pinata,
    }

    config.aragon = {
      appSrcPath: path.normalize(
        path.join(
          config.paths.root,
          userConfig.aragon?.appSrcPath ?? DEFAULT_APP_SRC_PATH
        )
      ),
      appBuildOutputPath: path.normalize(
        path.join(
          config.paths.root,
          userConfig.aragon?.appBuildOutputPath ?? DEFAULT_APP_BUILD_PATH
        )
      ),
      appBuildScript:
        userConfig.aragon?.appBuildScript ?? DEFAULT_APP_BUILD_SCRIPT,
      ignoreFilesPath: path.normalize(
        path.join(
          config.paths.root,
          userConfig.aragon?.ignoreFilesPath ?? DEFAULT_IGNORE_PATH
        )
      ),
      confirmations: userConfig.aragon?.confirmations ?? DEFAULT_CONFIRMATIONS,
    }
  }
)

task(TASK_PUBLISH, 'Publish a new app version to Aragon Package Manager')
  .addPositionalParam(
    'bump',
    'Type of bump (major, minor or patch) or semantic version',
    undefined,
    types.string
  )
  .addOptionalParam(
    'contract',
    'Contract address previously deployed.',
    undefined,
    types.string
  )
  .addOptionalParam(
    'ipfsApiUrl',
    'IPFS API URL to connect to an ipfs daemon API server',
    'http://localhost:5001',
    types.string
  )
  .addOptionalParam(
    'confirmations',
    'Number of block confirmations to wait after contract creation',
    undefined,
    types.int
  )
  .addOptionalParam(
    'constructorArgsPath',
    'File path to a javascript module that exports the list of constructor arguments.',
    undefined,
    types.inputFile
  )
  .addOptionalVariadicPositionalParam(
    'constructorArgsParams',
    'Contract constructor arguments. Ignored if the --constructor-args-path option is used.',
    []
  )
  .addFlag(
    'onlyContent',
    'Prevents contract compilation, deployment, and artifact generation.'
  )
  .addFlag('verify', 'Automatically verify contract on Etherscan.')
  .addFlag('skipAppBuild', 'Skip application build.')
  .addFlag('skipValidation', 'Skip validation of artifacts files.')
  .addFlag('dryRun', 'Output tx data without broadcasting')
  .setAction(async (args, hre) => {
    return publishTask(args, hre)
  })
