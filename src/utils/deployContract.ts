import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { TASK_COMPILE_CONTRACT } from '../task-names'
/**
 * Deploy a contract
 * @param hre Hardhat Runtime Environment
 * @param contractName contract name, may need to be fully
 *            qualified name. i.e. contracts/Projects.sol:Projects
 * @param args contract constructor arguments
 * @returns string - deployed contract address
 */
export default async function deployContract(
  hre: HardhatRuntimeEnvironment,
  contractName: string,
  args: any[] = []
): Promise<string> {
  await hre.run(TASK_COMPILE_CONTRACT)

  const factory = await hre.ethers.getContractFactory(contractName)
  const deployment = await factory.deploy(...args)
  const contractAddress = deployment.address
  await deployment.deployTransaction.wait()
  return contractAddress
}
