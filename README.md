# Aragon Hardhat plugin

Hardhat plugin for publishing Aragon apps and templates.

### Required plugins

This plugin currently requires:

- [**hardhat**](https://github.com/nomiclabs/hardhat/)
- [**hardhat-ethers**](https://github.com/nomiclabs/hardhat/tree/master/packages/hardhat-ethers)
- [**hardhat-etherscan**](https://github.com/nomiclabs/hardhat/tree/master/packages/hardhat-etherscan)


### Installation

```
yarn add --dev @aragon/hardhat-aragon @nomiclabs/hardhat-ethers ethers @nomiclabs/hardhat-etherscan
```

And add the following statement to your hardhat.config.js:

```js
require('@aragon/hardhat-aragon')
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-etherscan')
```

Or, if you are using TypeScript, add this to your hardhat.config.ts:

```
import '@aragon/hardhat-aragon'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
```

### Tasks

This plugin provides the `publish` task which allows you to publish an `Aragon` app to the `Aragon Package Manager`

### Usage

```
hardhat publish --contract <STRING> --ipfs-api-url <STRING> [--dry-run] [--only-content] [--skip-app-build] [--skip-validation] bump [...constructorArgs]

```

#### Options

* `--contract` Contract previously deployed
* `--dry-run` Output transaction data without broadcasting
* `--only-content` Prevents contract compilation, deployment, and artifact generation
* `--skip-app-build` Prevents building application
* `--skip-validation` Prevents validation of artifact files
* `--ipfs-api-url` Url to upload app content to IFPS

#### Positional Arguments

* `bump` Type of bump (major, minor, patch) or sematic version. Use major for contract change.
* `constructorArgs` Constructor arguments for the app contract, default [].
