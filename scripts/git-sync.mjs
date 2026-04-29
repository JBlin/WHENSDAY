import { spawnSync } from 'node:child_process'
import process from 'node:process'

const args = process.argv.slice(2)
const options = {
  shouldBuild: true,
  shouldPush: true,
}
const messageParts = []

for (const arg of args) {
  if (arg === '--skip-build') {
    options.shouldBuild = false
    continue
  }

  if (arg === '--no-push') {
    options.shouldPush = false
    continue
  }

  messageParts.push(arg)
}

const commitMessage = messageParts.join(' ').trim()

if (!commitMessage) {
  console.error(
    '[WHENSDAY sync] Commit message가 필요합니다. 예: npm run sync -- "Add regional tide cycles"'
  )
  process.exit(1)
}

function resolveExecution(command, commandArgs) {
  if (process.platform === 'win32' && command === 'npm') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'npm', ...commandArgs],
    }
  }

  return {
    command,
    args: commandArgs,
  }
}

function run(command, commandArgs, options = {}) {
  const execution = resolveExecution(command, commandArgs)
  console.log(`[WHENSDAY sync] > ${command} ${commandArgs.join(' ')}`)

  const result = spawnSync(execution.command, execution.args, {
    cwd: process.cwd(),
    stdio: options.captureOutput ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: options.captureOutput ? 'utf8' : undefined,
    shell: false,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    if (options.captureOutput) {
      const stderr = result.stderr?.trim()
      const stdout = result.stdout?.trim()
      if (stdout) console.error(stdout)
      if (stderr) console.error(stderr)
    }

    process.exit(result.status ?? 1)
  }

  return result
}

function getOutput(command, commandArgs) {
  return run(command, commandArgs, { captureOutput: true }).stdout?.trim() || ''
}

const stagedFiles = getOutput('git', ['diff', '--cached', '--name-only'])
const workingTree = getOutput('git', ['status', '--short'])

if (!workingTree && !stagedFiles) {
  console.log('[WHENSDAY sync] 커밋할 변경이 없습니다.')
  process.exit(0)
}

if (options.shouldBuild) {
  run('npm', ['run', 'build'])
}

if (!stagedFiles) {
  run('git', ['add', '-A'])
} else {
  console.log('[WHENSDAY sync] 이미 스테이징된 변경만 사용합니다.')
}

run('git', ['status', '--short'])
run('git', ['commit', '-m', commitMessage])

if (options.shouldPush) {
  run('git', ['push'])
} else {
  console.log('[WHENSDAY sync] push는 건너뛰었습니다.')
}
