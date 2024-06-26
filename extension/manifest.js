import packageJson from './package.json' assert { type: 'json' }

/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
  manifest_version: 3,
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  author: 'dominic cicilio',
  permissions: ['nativeMessaging', 'storage'],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'",
  },
  options_page: 'src/pages/options/index.html',
  background: {
    service_worker: 'src/pages/background/index.js',
    type: 'module',
  },
  action: {
    default_popup: 'src/pages/popup/index.html',
    default_icon: 'icon-32.png',
  },
  icons: {
    128: 'icon-128.png',
  },
  content_scripts: [
    {
      matches: ['https://www.github.com/*', 'https://github.com/*'],
      // KEY for cache invalidation
      js: ['src/pages/content/index.js'],
      css: ['assets/css/contentStyle<KEY>.chunk.css'],
    },
  ],
  devtools_page: 'src/pages/devtools/index.html',
  web_accessible_resources: [
    {
      resources: [
        'assets/js/*.js',
        'assets/js/*.wasm',
        'assets/css/*.css',
        'worker.**.js',
        'ffmpegScripts/**.js',
        'svg/**.svg',
        'icon-128.png',
        'icon-32.png',
      ],
      matches: ['*://*/*'],
    },
  ],
}

export default manifest
