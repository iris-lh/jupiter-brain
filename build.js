const Bundler = require('parcel-bundler')
const Path = require('path')
const fs = require('fs')
const chokidar = require('chokidar')

const entryFiles = Path.join(__dirname, './src/index.html')
const options = {
  cacheDir: '.parcel-cache',
}

function copyFile(srcPath) {
  const destPath = `./dist/${srcPath}`
  fs.copyFileSync(srcPath, destPath)
}

function deleteFile(srcPath) {
  const destPath = `./dist/${srcPath}`
  if (fs.existsSync(destPath)) fs.rmSync(destPath)
}

function deleteFolder(folderPath) {
  const destFolderPath = `./dist/${folderPath}`
  if (fs.existsSync(destFolderPath)) fs.rmSync(destFolderPath, {recursive: true})
}

function touchFolder(folderPath) {
  const destFolderPath = `./dist/${folderPath}`
  if (!fs.existsSync(destFolderPath)) fs.mkdirSync(destFolderPath)
}

function startWatcher() {
  const watchFolders = ['templates', 'scripts']

  watchFolders.forEach(folderName => {
    deleteFolder(folderName)
    touchFolder(folderName)
  })

  chokidar.watch(watchFolders)
  .on('add', (path) => {
    copyFile(path)
    // if (!fs.existsSync(`./dist/${path}`)) console.log('CHOKIDAR - File added:', path)
  })
  .on('change', (path) => {
    copyFile(path)
    console.log('CHOKIDAR - File changed:', path)
  })
  .on('unlink', (path) => {
    deleteFile(path)
    console.log('CHOKIDAR - File unlinked:', path)
  })
}

const go = async () => {
  startWatcher()
  const bundler = new Bundler(entryFiles, options)
  const bundle = await bundler.serve() 
}

go()
