export const getChromeNativeMessageManifestLocation = ({
  user,
  appName,
  platform = 'mac',
}: {
  user: string;
  appName: string;
  platform: 'mac';
}) => {
  return {
    mac: `/Users/${user}/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/${appName}.json`,
    win: `C:\\Users\\${user}\\AppData\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${appName}.json`,
    linux: `/home/${user}/.config/google-chrome/NativeMessagingHosts/${appName}.json`,
  }[platform];
};
