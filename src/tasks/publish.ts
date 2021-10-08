import execa from 'execa'
import { AragonPluginError } from '../errors'
import { HardhatRuntimeEnvironment, HttpNetworkConfig } from 'hardhat/types'

import { DEFAULT_IPFS_API_ENDPOINT, EXPLORER_CHAIN_URLS } from '../constants'
import { PublishTaskArguments, RepoContent } from '../types'

import { log } from '../utils/logger'
import * as apm from '../utils/apm'
import deployContract from '../utils/deployContract'
import { pinContent } from '../utils/ipfs/pinContent'
import {
  generateArtifacts,
  validateArtifacts,
  writeArtifacts,
} from '../utils/artifact'
import createIgnorePatternFromFiles from '../utils/createIgnorePatternFromFiles'
import parseAndValidateBumpOrVersion from '../utils/parseAndValidateBumpOrVersion'
import {
  getPrettyPublishTxPreview,
  getPublishTxOutput,
} from '../utils/prettyOutput'
import { pathExists } from '../utils/fsUtils'
import {
  uploadDirToIpfs,
  assertIpfsApiIsAvailable,
  guessGatewayUrl,
  assertUploadContentResolve,
} from '../utils/ipfs'
import { TASK_VERIFY_CONTRACT, TASK_GET_CONSTRUCTOR_ARGS } from '../task-names'
import {
  readArapp,
  parseAppName,
  getMainContractName,
  getEnsRegistry,
} from '../utils/arappUtils'

export async function publishTask(
  args: PublishTaskArguments,
  hre: HardhatRuntimeEnvironment
): Promise<apm.PublishVersionTxData> {
  const haveEtherscanApiKey =
    hre.config.etherscan && Boolean(hre.config.etherscan.apiKey)
  if (args.verify && !haveEtherscanApiKey)
    throw new AragonPluginError(
      `To verify your contracts you need to configure etherscan.apiKey in hardhat.config.json`
    )

  const [owner] = await hre.ethers.getSigners()

  // Do param type verification here and call publishTask with clean params
  const bumpOrVersion = args.bump
  const existingContractAddress = args.contract
  const {
    appSrcPath,
    appBuildOutputPath,
    appBuildScript,
    ignoreFilesPath,
  } = hre.config.aragon

  const arapp = readArapp()
  const finalAppEnsName = parseAppName(arapp, hre.network.name)
  const appContractName = getMainContractName()
  const ensRegistry = getEnsRegistry(arapp, hre.network.name)
  const ipfsApiUrl = args.ipfsApiUrl || hre.config.ipfs.url

  // Setup provider with the right ENS registy address
  let provider
  if (hre.network.name === 'hardhat') {
    hre.ethers.provider.network.ensAddress = ensRegistry
    provider = hre.ethers.provider
  } else {
    const { chainId } = await hre.ethers.provider.getNetwork()
    provider = new hre.ethers.providers.JsonRpcProvider(
      (hre.network.config as HttpNetworkConfig).url,
      {
        name: hre.network.name,
        ensAddress: ensRegistry,
        chainId,
      }
    )
  }

  const prevVersion = await apm.getLastestVersionIfExists(
    finalAppEnsName,
    provider
  )
  const { bump, nextVersion } = parseAndValidateBumpOrVersion(
    bumpOrVersion,
    prevVersion ? prevVersion.version : undefined
  )
  log(`Applying version bump ${bump}, next version: ${nextVersion}`)

  // Do sanity checks before compiling the contract or uploading files
  // So users do not have to wait a long time before seeing the config is not okay
  await apm.assertCanPublish(finalAppEnsName, owner.address, provider)
  const ipfs = await assertIpfsApiIsAvailable(ipfsApiUrl)

  // Using let + if {} block instead of a ternary operator
  // to assign value and log status to console
  let contractAddress: string
  if (args.onlyContent) {
    contractAddress = hre.ethers.constants.AddressZero
    log('No contract used for this version')
  } else if (existingContractAddress) {
    contractAddress = existingContractAddress
    log(`Using provided contract address: ${contractAddress}`)
  } else if (!prevVersion || bump === 'major') {
    log('Deploying new contract.')
    const confirmBlocks = args.confirmations || hre.config.aragon?.confirmations
    const constructorArgs = await hre.run(TASK_GET_CONSTRUCTOR_ARGS, {
      constructorArgsModule: args.constructorArgsPath,
      constructorArgsParams: args.constructorArgsParams,
    })
    contractAddress = await deployContract(
      hre,
      appContractName,
      constructorArgs,
      confirmBlocks
    )
    log(`New contract address: ${contractAddress}`)

    if (args.verify) {
      log(`Verifying contract address: ${contractAddress}`)
      try {
        await hre.run(TASK_VERIFY_CONTRACT, {
          address: contractAddress,
          constructorArguments: constructorArgs,
        })
      } catch (e) {
        // do not stop on contract verification error
        // let user verify manually later
        log(`Error verifying contract ${(e as Error).message}`)
      }
    }
  } else {
    contractAddress = prevVersion.contractAddress
    log(`Reusing previous version contract address: ${contractAddress}`)
  }

  if (!args.skipAppBuild && pathExists(appSrcPath)) {
    log(`Running app build script...`)
    try {
      await execa('npm', ['run', appBuildScript], {
        cwd: appSrcPath,
      })
    } catch (e) {
      throw new AragonPluginError(
        `Make sure the app dependencies were installed`
      )
    }
  }

  if (!args.onlyContent) {
    let content: RepoContent
    if (prevVersion && bump !== 'major') {
      log(`Resolving Aragon artifacts from Aragon Package Manager`)
      content = await apm.resolveRepoContentUri(prevVersion.contentUri, {
        ipfsGateway: hre.config.ipfs.gateway,
      })
    } else {
      log(`Generating Aragon app artifacts`)
      content = await generateArtifacts(
        arapp,
        finalAppEnsName,
        appContractName,
        hre
      )
    }

    writeArtifacts(appBuildOutputPath, content)

    if (!args.skipValidation) {
      const hasFrontend = appSrcPath ? true : false
      validateArtifacts(appBuildOutputPath, appContractName, hasFrontend)
    }
  }

  // Upload release directory to IPFS
  log('Uploading release assets to IPFS...')
  const contentHash = await uploadDirToIpfs({
    dirPath: appBuildOutputPath,
    ipfs,
    ignore: createIgnorePatternFromFiles(ignoreFilesPath),
  })
  log(`Release assets uploaded to IPFS: ${contentHash}`)

  await assertUploadContentResolve(contentHash, hre.config.ipfs.gateway)

  if (hre.config.ipfs.pinata && hre.config.ipfs.pinata.key !== '') {
    log('Pinning content to pinata...')
    const response = await pinContent({
      contentHash,
      appEnsName: finalAppEnsName,
      version: nextVersion,
      network: hre.network.name,
      pinata: hre.config.ipfs.pinata,
    })
    if (response)
      log(`Content pinned:
        id: ${response.id}
        status: ${response.status}
        name: ${response.name}`)
  }

  // Generate tx to publish new app to aragonPM
  const versionInfo = {
    version: nextVersion,
    contractAddress,
    contentUri: apm.toContentUri('ipfs', contentHash),
  }

  const txData = await apm.publishVersion(
    finalAppEnsName,
    versionInfo,
    provider,
    {
      managerAddress: owner.address,
    }
  )

  const activeIpfsGateway = await guessGatewayUrl({
    ipfsApiUrl,
    ipfsGateway: hre.config.ipfs.gateway,
    contentHash,
  })

  log(
    getPrettyPublishTxPreview({
      txData,
      appName: finalAppEnsName,
      nextVersion,
      bump,
      contractAddress,
      contentHash,
      ipfsGateway: activeIpfsGateway || DEFAULT_IPFS_API_ENDPOINT,
    })
  )

  if (args.dryRun) {
    log(
      getPublishTxOutput.dryRun({
        txData,
        rootAccount: owner.address,
      })
    )
  } else {
    const tranactionResponse = await owner.sendTransaction({
      to: txData.to,
      data: apm.encodePublishVersionTxData(txData),
    })

    const { chainId } = await provider.getNetwork()
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const explorerTxUrl = EXPLORER_CHAIN_URLS[chainId]

    log(getPublishTxOutput.txHash(tranactionResponse.hash, explorerTxUrl))

    const receipt = await tranactionResponse.wait()

    log(getPublishTxOutput.receipt(receipt))
  }

  // For testing
  return txData
}