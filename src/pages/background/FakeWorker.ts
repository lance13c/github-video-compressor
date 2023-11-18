/* eslint-disable @typescript-eslint/ban-types */
type EventType = 'message' | 'error';
type CustomEventListener = (event: unknown) => void;

class FakeWorker {
  private workerFunction: Function | null = null;
  public onmessage: CustomEventListener | null = null;
  public onerror: CustomEventListener | null = null;

  constructor(private scriptUrl: string) {
    // Load and execute the script
    try {
      fetch(scriptUrl)
        .then(response => response.text())
        .then(code => {
          this.workerFunction = new Function('self', code) as Function;
          this.workerFunction(this); // 'self' in worker scope refers to the worker itself
        })
        .catch(error => {
          if (this.onerror) {
            this.onerror(error);
          }
        });
    } catch (error) {
      if (this.onerror) {
        this.onerror(error);
      }
    }
  }

  postMessage(message: unknown): void {
    if (typeof this.onmessage === 'function') {
      // Call the onmessage with a simulated event object
      setTimeout(() => {
        this.onmessage!({ data: message });
      }, 0);
    }
  }

  terminate(): void {
    // No real termination needed as we're not in a separate thread,
    // but you could add cleanup logic here if needed.
  }

  addEventListener(type: EventType, listener: EventListener): void {
    if (type === 'message') {
      this.onmessage = listener;
    } else if (type === 'error') {
      this.onerror = listener;
    }
  }

  removeEventListener(type: EventType, listener: EventListener): void {
    if (type === 'message' && this.onmessage === listener) {
      this.onmessage = null;
    } else if (type === 'error' && this.onerror === listener) {
      this.onerror = null;
    }
  }

  dispatchEvent(event: Event): boolean {
    if (event.type === 'message' && this.onmessage) {
      this.onmessage(event);
    } else if (event.type === 'error' && this.onerror) {
      this.onerror(event);
    }
    return true;
  }
}

export default FakeWorker;
