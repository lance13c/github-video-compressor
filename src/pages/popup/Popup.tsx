import logo from '@assets/img/logo.svg';
import '@pages/popup/Popup.css';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import withSuspense from '@src/shared/hoc/withSuspense';
import useStorage from '@src/shared/hooks/useStorage';
import exampleThemeStorage from '@src/shared/storages/exampleThemeStorage';
// import { useEffect, useState } from 'react';

// const writeFile = async ffmpeg => {
//   console.log('load');
//   await ffmpeg.writeFile('temp.txt', 'Hello World123').catch(err => {
//     console.log('err writing file', err);
//   });
//   console.log('after write');

//   const textTxt = await ffmpeg.readFile('temp.txt').catch(err => {
//     console.log('err reading file', err);
//   });

//   console.log('temp', textTxt);
// };

const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  // const [ffmpeg, setFFmpeg] = useState(null);

  // useEffect(() => {
  //   const initffmpeg = new FFmpeg();
  //   console.log('init ffmpeg', initffmpeg);
  //   console.log('start load');
  //   initffmpeg.load().then(() => {
  //     console.log('set ffmpeg');
  //     setFFmpeg(initffmpeg);
  //   });
  // }, []);

  // const handleClick = () => {
  //   console.log('init', ffmpeg);

  //   if (ffmpeg?.loaded) {
  //     writeFile(ffmpeg);
  //   } else {
  //     console.log('not loaded yet');
  //   }
  // };

  return (
    <div
      className="App"
      style={{
        backgroundColor: theme === 'light' ? '#fff' : '#000',
      }}>
      <header className="App-header" style={{ color: theme === 'light' ? '#000' : '#fff' }}>
        <img src={logo} className="App-logo" alt="logo" />
        <p>Hello World</p>

        {/* <button onClick={handleClick}>Write File</button> */}
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
