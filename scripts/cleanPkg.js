// Clean Svelte Kit /package for publishing.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pkg from '../package/package.json' assert { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (pkg.devDependencies) delete pkg.devDependencies

fs.writeFile(path.resolve(__dirname, '../package/package.json'), JSON.stringify(pkg, null, 2), (err) => {
  if (err) throw err
  console.log('package.json cleaned')
})
