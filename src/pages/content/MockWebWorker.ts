type MessageEvent = { data: any };
type OnMessageHandler = (event: MessageEvent) => void | Promise<void>;

class MockWebWorker {
  private scriptUrl: URL;
  private workerModule: any | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((error: any) => void) | null = null;

  constructor(
    scriptUrl: URL,
    config: {
      type: 'module';
    },
  ) {
    console.log('config', config);
    // if (scriptUrl?.toString() === 'https://github.com/') {
    //   return;
    // }
    // this.scriptUrl = scriptUrl;
  }

  // Simulates posting a message to the worker
  async postMessage(message: any, transfer: any): Promise<void> {
    try {
      // Import the script only if it hasn't been imported before
      // if (!this.scriptUrl) {
      //   console.warn('No script');
      //   return;
      // }

      if (!this.workerModule) {
        const { FFmpegWorker } = await import('./FFmpeg-ES.js');
        this.workerModule = new FFmpegWorker(message);
        console.log('default', this.workerModule?.default);
        console.log('workerModule', this.workerModule);
        // How to execute this module
      }

      if (this.workerModule?.postMessage) {
        console.log('postMessage', this.workerModule?.postMessage);
      }

      // Check if the module has an 'onmessage' handler
      if (this.workerModule && this.workerModule.onMessage) {
        // Execute the onmessage function with the message event
        const result = await this.workerModule.onMessage({ data: message });

        // If there's a handler for onmessage in the mock, call it
        if (this.onmessage) {
          this.onmessage({ data: result });
        }
      }
    } catch (error) {
      // Handle any errors that occur during import or execution
      if (this.onerror) {
        this.onerror(error);
      } else {
        console.error('Error in MockWebWorker:', error);
      }
    }
  }

  // Add other methods and properties as needed to mimic a Web Worker
  terminate(): void {
    console.log('Worker terminated');
    this.workerModule = null;
  }

  // Additional methods and event handlers can be added here
}

export default MockWebWorker;

// /* eslint-disable @typescript-eslint/ban-types */
// type EventType = 'message' | 'messageerror' | 'error';
// type CustomEventListener = (event: unknown) => void;

// class FakeWorker {
//   private workerFunction: Function | null = null;
//   public onmessage: CustomEventListener | null = e => {
//     console.log('TEMP:', e);
//   };
//   public onmessageError: CustomEventListener | null = err => {
//     console.error('TEMP_MES_ERR:', err);
//   };
//   public onerror: CustomEventListener | null = err => {
//     console.error('TEMP_ERR:', err);
//   };

//   constructor(
//     private scriptUrl: URL,
//     private config: Record<string, unknown>,
//     private third: unknown,
//   ) {
//     // Check the script is the same as the current origin
//     const scriptOrigin = scriptUrl.origin;
//     console.log('third', third);

//     console.log('config', config);
//     if (scriptOrigin !== window.location.origin) {
//       throw new DOMException(
//         `Failed to construct 'FakeWorker': Script at '${scriptUrl}' cannot be accessed from origin '${window.location.origin}'.`,
//         'SecurityError',
//       );
//     }

//     // Check if it is just the root path
//     // if (scriptUrl.pathname === '/') {
//     //   throw new DOMException(
//     //     `Failed to construct 'FakeWorker': Script at '${scriptUrl}' cannot be accessed from origin '${window.location.origin}'.`,
//     //     'SecurityError',
//     //   );
//     // }

//     // Load and execute the script
//     console.log('scriptUrl', scriptUrl);
//     try {
//       import(scriptUrl.toString())
//         .then(response => response.text())
//         .then(code => {
//           this.workerFunction = new Function('self', code) as Function;
//           this.workerFunction(this); // 'self' in worker scope refers to the worker itself
//         })
//         .catch(error => {
//           if (this.onerror) {
//             this.onerror(error);
//           }
//         });
//     } catch (error) {
//       if (this.onerror) {
//         this.onerror(error);
//       }
//     }
//   }

//   postMessage(message: unknown, transfer: unknown): void {
//     if (typeof this.onmessage === 'function') {
//       // Call the onmessage with a simulated event object
//       setTimeout(() => {
//         // console.log('message', message);
//         this.onmessage!({ data: message, transfer });
//       }, 0);
//     }
//   }

//   terminate(): void {
//     // No real termination needed as we're not in a separate thread,
//     // but you could add cleanup logic here if needed.
//   }

//   addEventListener(type: EventType, listener: EventListener): void {
//     if (type === 'message') {
//       console.log('listener', listener);
//       this.onmessage = listener;
//     } else if (type === 'messageerror' && this.onmessageError === listener) {
//       this.onmessageError = listener;
//     } else if (type === 'error') {
//       this.onerror = listener;
//     } else {
//       console.warn('unknown event (add): ', type, listener);
//     }
//   }

//   removeEventListener(type: EventType, listener: EventListener): void {
//     if (type === 'message' && this.onmessage === listener) {
//       this.onmessage = null;
//     } else if (type === 'messageerror' && this.onmessageError === listener) {
//       this.onmessageError = null;
//     } else if (type === 'error' && this.onerror === listener) {
//       this.onerror = null;
//     } else {
//       console.warn('unknown event(remove): ', type, listener);
//     }
//   }

//   dispatchEvent(event: Event): boolean {
//     if (event.type === 'message' && this.onmessage) {
//       this.onmessage(event);
//     } else if (event.type === 'messageerror' && this.onmessageError) {
//       this.onmessageError(event);
//     } else if (event.type === 'error' && this.onerror) {
//       this.onerror(event);
//     } else {
//       console.warn('unknown event(dispatch): ', event);
//     }
//     return true;
//   }
// }
