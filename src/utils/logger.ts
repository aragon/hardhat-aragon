import chalk, { ForegroundColor } from 'chalk'

let logTag = chalk.gray('aragon | ')

function _prependTag(
  lines: string,
  tag: string,
  color?: typeof ForegroundColor
): string {
  if (color) tag = chalk[color](tag)
  return lines
    .split('\n')
    .map((line) => tag + line)
    .join('\n')
}

export function log(data: string): void {
  // eslint-disable-next-line no-console
  console.log(_prependTag(data, logTag))
}
