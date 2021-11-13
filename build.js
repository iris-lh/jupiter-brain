const Bundler = require('parcel-bundler')
const Path = require('path')
const fs = require('fs')

const entryFiles = Path.join(__dirname, './index.html')
const options = {
  cacheDir: '.parcel-cache',
}

function buildPointerFile (folderName) {
  console.log(`Building ${folderName}`)
  const paths = fs.readdirSync(`./${folderName}`)
  const lines = []
  lines.push('module.exports = {')
  paths.forEach(path => {
    const name = path.split('.')[0]
    lines.push(`  '${name}': require('./${folderName}/${path}'),`)
  })
  lines.push('}')
  fs.writeFileSync(`./${folderName}.js`, lines.join('\n'))
}

const go = async () => {
  const bundler = new Bundler(entryFiles, options)
  buildPointerFile('templates')
  buildPointerFile('scripts')

  bundler.on('buildStart', entryPoints => {
  });

  const bundle = await bundler.serve()
}

go()
