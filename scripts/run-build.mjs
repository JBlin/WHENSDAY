import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const cwd = process.cwd()
const userArgs = process.argv.slice(2)
const localVite = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
const localBuildScript = path.join(cwd, 'build-local.ps1')

let command
let args

if (process.platform === 'win32' && existsSync(localBuildScript)) {
  command = 'powershell.exe'
  args = ['-ExecutionPolicy', 'Bypass', '-File', localBuildScript]
} else if (existsSync(localVite)) {
  command = process.execPath
  args = [localVite, 'build', ...userArgs]
} else {
  console.error('[SetDate] Vite를 찾을 수 없습니다. npm install로 의존성을 먼저 설치해 주세요.')
  process.exit(1)
}

const child = spawn(command, args, {
  cwd,
  stdio: 'inherit',
  shell: false,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
