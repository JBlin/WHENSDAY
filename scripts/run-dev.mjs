import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const cwd = process.cwd()
const userArgs = process.argv.slice(2)

const localVite = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
const fallbackScript = path.join(cwd, 'dev.ps1')
const fallbackVite = 'C:\\WhensDay_modules\\node_modules\\vite\\bin\\vite.js'

let command
let args

if (existsSync(localVite)) {
  command = process.execPath
  args = [localVite, ...userArgs]
} else if (process.platform === 'win32' && existsSync(fallbackScript) && existsSync(fallbackVite)) {
  command = 'powershell.exe'
  args = ['-ExecutionPolicy', 'Bypass', '-File', fallbackScript, ...userArgs]
} else {
  console.error(
    '[SetDate] Vite를 찾을 수 없습니다. 로컬 node_modules를 설치하거나 C:\\WhensDay_modules 우회 환경을 준비해 주세요.'
  )
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
