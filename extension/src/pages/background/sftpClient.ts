import { Client } from 'ssh2';

export const connectToSFTP = async (privateKey: string) => {
  const client = new Client();
  client.on('ready', () => {
    console.log('Client :: ready');
    client.sftp((err, sftp) => {
      if (err) throw err;

      // Use the `sftp` object to interact with the SFTP server
      // For example, to list files in the remote directory:
      sftp.readdir('remote-directory-path', (err, list) => {
        if (err) throw err;
        console.log('Directory listing: ', list);
        // Close the SFTP session once done
        client.end();
      });
    });
  });

  // Replace with your SFTP server details
  client.connect({
    host: '127.0.0.1',
    port: 7779,
    privateKey
  });

  return client
};
