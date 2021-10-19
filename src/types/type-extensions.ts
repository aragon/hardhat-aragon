// If your plugin extends types from another plugin, you should import the plugin here.

// To extend one of Hardhat's types, you need to import the module where it has been defined, and redeclare it.
import 'hardhat/types/config'
import 'hardhat/types/runtime'

import { AragonConfig, AragonUserConfig, IpfsConfig, IpfsUserConfig } from '.'

declare module 'hardhat/types/config' {
  export interface HardhatUserConfig {
    ipfs?: IpfsUserConfig
    aragon: AragonUserConfig
  }

  export interface HardhatConfig {
    ipfs: IpfsConfig
    aragon: AragonConfig
    etherscan: any
  }

  export interface HardhatNetworkUserConfig {
    appEnsName?: string
    ensRegistry?: string
  }

  export interface HttpNetworkUserConfig {
    appEnsName?: string
    ensRegistry?: string
  }

  export interface HardhatNetworkConfig {
    appEnsName?: string
    ensRegistry?: string
  }

  export interface HttpNetworkConfig {
    appEnsName?: string
    ensRegistry?: string
  }
}

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    ipfs: any
    ethers: any
  }
}
