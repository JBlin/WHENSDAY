import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  watch,
} from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

const cwd = process.cwd()
const userArgs = process.argv.slice(2)

const fallbackRoot = 'C:\\WhensDay_modules'
const localVite = path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js')
const fallbackVite = path.join(fallbackRoot, 'node_modules', 'vite', 'bin', 'vite.js')

const excludedDirs = new Set(['node_modules', 'dist', '.git', '.claude'])
const excludedExtensions = new Set(['.ps1', '.cmd'])
const excludedFiles = new Set(['.codex-dev.log'])

function hasNonAsciiPath(value) {
  return /[^\u0000-\u007f]/.test(value)
}

function shouldUseWindowsFallback() {
  if (process.platform !== 'win32' || !existsSync(fallbackVite)) {
    return false
  }

  const normalizedCwd = cwd.toLowerCase()
  return normalizedCwd.includes('onedrive') || hasNonAsciiPath(cwd)
}

function normalizeRelativePath(relativePath) {
  return relativePath.replace(/[\\/]+/g, path.sep)
}

function shouldSkipRelative(relativePath) {
  if (!relativePath || relativePath === '.') {
    return false
  }

  const normalized = normalizeRelativePath(relativePath)
  const segments = normalized.split(path.sep).filter(Boolean)

  if (segments.some((segment) => excludedDirs.has(segment))) {
    return true
  }

  const basename = segments[segments.length - 1]
  if (excludedFiles.has(basename)) {
    return true
  }

  return excludedExtensions.has(path.extname(basename).toLowerCase())
}

function ensureParentDirectory(filePath) {
  mkdirSync(path.dirname(filePath), { recursive: true })
}

function syncPath(relativePath) {
  if (shouldSkipRelative(relativePath)) {
    return
  }

  const normalized = normalizeRelativePath(relativePath)
  const sourcePath = path.join(cwd, normalized)
  const destinationPath = path.join(fallbackRoot, normalized)

  if (!existsSync(sourcePath)) {
    rmSync(destinationPath, { recursive: true, force: true })
    return
  }

  const sourceStats = statSync(sourcePath)
  if (sourceStats.isDirectory()) {
    mkdirSync(destinationPath, { recursive: true })
    return
  }

  ensureParentDirectory(destinationPath)
  copyFileSync(sourcePath, destinationPath)
}

function syncDirectory(relativeDir = '') {
  const sourceDir = relativeDir ? path.join(cwd, relativeDir) : cwd

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    const nextRelative = relativeDir ? path.join(relativeDir, entry.name) : entry.name

    if (shouldSkipRelative(nextRelative)) {
      continue
    }

    if (entry.isDirectory()) {
      mkdirSync(path.join(fallbackRoot, nextRelative), { recursive: true })
      syncDirectory(nextRelative)
      continue
    }

    syncPath(nextRelative)
  }
}

function startMirrorWatcher() {
  const pending = new Map()
  const watcher = watch(cwd, { recursive: true }, (_, filename) => {
    if (!filename) {
      return
    }

    const relativePath = normalizeRelativePath(filename.toString())
    if (shouldSkipRelative(relativePath)) {
      return
    }

    const existingTimer = pending.get(relativePath)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      pending.delete(relativePath)

      try {
        syncPath(relativePath)
      } catch (error) {
        console.error(`[SetDate] Failed to sync ${relativePath}: ${error.message}`)
      }
    }, 75)

    pending.set(relativePath, timer)
  })

  return () => {
    for (const timer of pending.values()) {
      clearTimeout(timer)
    }

    watcher.close()
  }
}

function runChild(command, args, childCwd, cleanup = () => {}) {
  const child = spawn(command, args, {
    cwd: childCwd,
    stdio: 'inherit',
    shell: false,
  })

  let cleanedUp = false
  const runCleanup = () => {
    if (cleanedUp) {
      return
    }

    cleanedUp = true
    cleanup()
  }

  const forwardSignal = (signal) => {
    runCleanup()
    child.kill(signal)
  }

  process.once('SIGINT', () => forwardSignal('SIGINT'))
  process.once('SIGTERM', () => forwardSignal('SIGTERM'))

  child.on('exit', (code, signal) => {
    runCleanup()

    if (signal) {
      process.kill(process.pid, signal)
      return
    }

    process.exit(code ?? 0)
  })
}

if (shouldUseWindowsFallback()) {
  try {
    syncDirectory()
  } catch (error) {
    console.error(`[SetDate] Failed to mirror project files: ${error.message}`)
    process.exit(1)
  }

  console.log('')
  console.log('SetDate dev server  -> http://localhost:5173')
  console.log('(Ctrl+C to stop)')
  console.log('')

  const stopWatching = startMirrorWatcher()
  runChild(process.execPath, [fallbackVite, ...userArgs], fallbackRoot, stopWatching)
} else if (existsSync(localVite)) {
  runChild(process.execPath, [localVite, ...userArgs], cwd)
} else if (process.platform === 'win32' && existsSync(fallbackVite)) {
  try {
    syncDirectory()
  } catch (error) {
    console.error(`[SetDate] Failed to mirror project files: ${error.message}`)
    process.exit(1)
  }

  const stopWatching = startMirrorWatcher()
  runChild(process.execPath, [fallbackVite, ...userArgs], fallbackRoot, stopWatching)
} else {
  console.error(
    '[SetDate] Vite를 찾을 수 없습니다. 로컬 node_modules를 설치하거나 C:\\WhensDay_modules 우회 환경을 준비해 주세요.'
  )
  process.exit(1)
}
