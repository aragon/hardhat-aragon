import { parse, visit } from '@solidity-parser/parser'
import { StateVariableDeclaration } from '@solidity-parser/parser/dist/ast-types'

/**
 * Finds global storage variable declarations with initialized values, e.g 'int a = 1'.
 *
 * @param sourceCode Source code of the contract.
 */
export function parseGlobalVariableAssignments(sourceCode: string): string[] {
  const ast = parse(sourceCode, {})
  const variables: string[] = []
  visit(ast, {
    StateVariableDeclaration: function (node: StateVariableDeclaration) {
      const variable = node.variables[0]
      if (
        variable.isStateVar &&
        !variable.isDeclaredConst &&
        variable.expression
      ) {
        variables.push(variable.name)
      }
    },
  })
  return variables
}
