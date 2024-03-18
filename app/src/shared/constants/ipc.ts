export const IPC = {
  WINDOWS: {
    ABOUT: {
      CREATE_WINDOW: 'windows: create-about-window',
      WHEN_WINDOW_CLOSE: 'windows: when-about-window-close',
    },
    SETUP: {
      CREATE_WINDOW: 'windows: create-setup-window',
      WHEN_WINDOW_CLOSE: 'windows: when-setup-window-close',
      FFMPEG_INSTALL_STATUS: 'windows: ffmpeg-setup-install-status',
      FFMPEG_IS_INSTALLED: 'windows: ffmpeg-is-installed',
      FFMPEG_INSTALL_LOGS: 'windows: ffmpeg-install-logs',
    },
  },
}

export type InstallStatus = 'Uninstalled' | 'Installing' | 'Installed' | 'Failed' | 'None'

export const INSTALL_STATUS = {
  UNINSTALLED: 'Uninstalled',
  INSTALLING: 'Installing',
  INSTALLED: 'Installed',
  FAILED: 'Failed',
  NONE: 'None',
} satisfies Record<Uppercase<InstallStatus>, InstallStatus>
