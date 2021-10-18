import {
  TASK_COMPILE_CONTRACT,
  TASK_VERIFY_CONTRACT,
  TASK_GET_CONSTRUCTOR_ARGS,
  TASK_DEPLOY_SUBTASK,
} from '../task-names'
import { log } from '../utils/logger'
import {
  DeployTaskArguments,
  DeploySubtaskArguments,
  VerifyTaskArguments,
  DeployContractDryRunArguments,
  DeployContractArguments,
} from '../types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

/**
 * Task to deploy a contract
 * @param args contract deployment arguments
 * @param hre hardhat runtime environment
 * @returns
 */
export async function deployTask(
  {
    contract,
    constructorArgsPath: constructorArgsModule,
    constructorArgsParams,
    confirmations,
    verify,
    dryRun,
  }: DeployTaskArguments,
  { run }: HardhatRuntimeEnvironment
) {
  const constructorArguments = await run(TASK_GET_CONSTRUCTOR_ARGS, {
    constructorArgsModule,
    constructorArgsParams,
  })

  return run(TASK_DEPLOY_SUBTASK, {
    contract,
    constructorArguments,
    confirmations,
    verify,
    dryRun,
  })
}

/**
 * Subtask to deploy a contract
 * @param args
 * @param hre
 * @returns
 */
export async function deploySubtask(
  {
    contract,
    constructorArguments,
    confirmations,
    verify,
    dryRun,
  }: DeploySubtaskArguments,
  hre: HardhatRuntimeEnvironment
) {
  await hre.run(TASK_COMPILE_CONTRACT)

  if (dryRun) {
    return deployContractDryRun({ contract, constructorArguments }, hre)
  }

  const contractAddress = await deployContract(
    {
      contract,
      constructorArguments,
      confirmations,
    },
    hre
  )

  if (verify) {
    await verifyContract({ contractAddress, constructorArguments }, hre)
  }

  return contractAddress
}

/**
 *
 * @param args contract name and constructor arguments
 * @param hre hardhat runtime environment with ethers library
 * @returns
 */
async function deployContractDryRun(
  { contract, constructorArguments = [] }: DeployContractDryRunArguments,
  { ethers }: HardhatRuntimeEnvironment
): Promise<string> {
  log('DRY RUN: Contract creation')
  const factory = await ethers.getContractFactory(contract)
  factory.getDeployTransaction(...constructorArguments)
  const [signer] = await ethers.getSigners()
  const tx = {
    from: signer.address,
    nonce: await ethers.provider.getTransactionCount(signer.address),
  }
  log(`  from:  ${tx.from}`)
  log(`  nonce: ${tx.nonce}`)
  const contractAddress = ethers.utils.getContractAddress(tx)
  log(`  New contract address: ${contractAddress}`)

  return contractAddress
}

/**
 * Deploy a contract
 * @param args contract name, contractor arguments and confirmations
 * @param hre hardhat runtime environment with ethers library
 * @returns
 */
async function deployContract(
  {
    contract,
    constructorArguments = [],
    confirmations,
  }: DeployContractArguments,
  { ethers }: HardhatRuntimeEnvironment
): Promise<string> {
  log('Deploying new contract.')
  const factory = await ethers.getContractFactory(contract)
  const deployment = await factory.deploy(...constructorArguments)
  const contractAddress = deployment.address
  await deployment.deployTransaction.wait(confirmations)
  log(`New contract address: ${contractAddress}`)
  return contractAddress
}

/**
 * Verify contract using hardhat verify contract subtask
 * @param args: contract address and contract constructor arguments
 * @param hre: hardhat runtime environment
 */
async function verifyContract(
  { contractAddress, constructorArguments }: VerifyTaskArguments,
  { run }: HardhatRuntimeEnvironment
): Promise<void> {
  log(`Verifying contract address: ${contractAddress}`)

  try {
    await run(TASK_VERIFY_CONTRACT, {
      address: contractAddress,
      constructorArguments,
    })
  } catch (e) {
    // do not stop on contract verification error
    // let user verify manually later
    log(`Error verifying contract ${(e as Error).message}`)
    log('Please verify the contract manually later')
  }
}
