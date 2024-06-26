const { main, name, version, resources, description, displayName, author: _author } = require('./package.json')

const { getDevFolder } = require('./bin/utils')

const author = _author?.name ?? _author
const currentYear = new Date().getFullYear()
const authorInSnakeCase = author.replace(/\s+/g, '_')
const appId = `com.${authorInSnakeCase}.${name}`.toLowerCase()
console.log('appId: ' + appId)

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId,
  productName: displayName,
  copyright: `Copyright © ${currentYear} — ${author}`,

  directories: {
    app: getDevFolder(main),
    output: `dist/v${version}`,
  },

  forceCodeSigning: true,

  mac: {
    icon: `${resources}/build/icons/icon.icns`,
    category: 'public.app-category.utilities',
  },

  dmg: {
    icon: false,
    sign: true,
  },

  // linux: {
  //   category: 'Utilities',
  //   synopsis: description,
  //   target: ['AppImage', 'deb', 'pacman', 'freebsd', 'rpm'],
  // },

  // win: {
  //   icon: `${resources}/build/icons/icon.ico`,
  //   target: ['nsis', 'portable', 'zip'],
  // },
}
