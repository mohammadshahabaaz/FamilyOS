const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot   = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch the whole monorepo so changes to packages/shared are picked up
config.watchFolders = [workspaceRoot]

// Resolve modules from both the app's own node_modules and the root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
