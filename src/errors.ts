import { HardhatPluginError } from 'hardhat/plugins'

export class AragonPluginError extends HardhatPluginError {
  constructor(message: string, parent?: Error) {
    super('hardhat-aragon', message, parent)
  }
}
