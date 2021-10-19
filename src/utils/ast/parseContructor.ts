import { parse, visit } from '@solidity-parser/parser'
import { FunctionDefinition } from '@solidity-parser/parser/dist/ast-types'

/**
 * Returns true if a contract has a constructor, otherwise false.
 *
 * @param sourceCode Source code of the contract.
 */
export function hasConstructor(sourceCode: string): boolean {
  const ast = parse(sourceCode, {})
  let foundConstructor = false

  visit(ast, {
    FunctionDefinition: function (node: FunctionDefinition) {
      if (!node.isConstructor) return
      foundConstructor = true
    },
  })

  return foundConstructor
}
