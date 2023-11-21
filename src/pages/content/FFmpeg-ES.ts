import createFFmpegCore from '@ffmpeg/core';

type LoadOptions = {
  coreURL?: string;
  wasmURL?: string;
  workerURL?: string;
};

type ExecOptions = {
  args: string[];
  timeout?: number;
};

type FileOptions = {
  path: string;
  data?: Uint8Array;
  encoding?: string;
};

type RenameOptions = {
  oldPath: string;
  newPath: string;
};

type DirOptions = {
  path: string;
};

type FileSystemType = string; // Replace with a more specific type if applicable

type MountConfigOptions = {
  // Define the structure of the options object here.
  // This structure depends on what your ffmpeg library expects.
  [key: string]: any;
};

type MountOptions = {
  fsType: FileSystemType; // The type of file system to mount.
  options: MountConfigOptions; // Options for mounting the file system.
  mountPoint: string; // The point in the virtual file system where this should be mounted.
};

interface CreateFFmpegCoreOptions {
  mainScriptUrlOrBlob: string;
}

interface CreateFFmpegCore {
  (options: CreateFFmpegCoreOptions): Promise<FFmpeg>;
}

interface FFmpeg {
  setLogger: (callback: (data: any) => void) => void;
  setProgress: (callback: (data: any) => void) => void;
  setTimeout: (timeout: number) => void;
  exec: (...args: string[]) => void;
  ret: any;
  reset: () => void;
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string, options?: { encoding: string }) => any;
    unlink: (path: string) => void;
    rename: (oldPath: string, newPath: string) => void;
    mkdir: (path: string) => void;
    readdir: (path: string) => string[];
    stat: (path: string) => { mode: number };
    isDir: (mode: number) => boolean;
    rmdir: (path: string) => void;
    mount: (fs: FileSystem, options: any, mountPoint: string) => void;
    unmount: (mountPoint: string) => void;
    // Add any other filesystem methods if available
  };
  // ... other properties and methods of ffmpeg ...
}

declare global {
  interface WindowOrWorkerGlobalScope {
    createFFmpegCore: CreateFFmpegCore;
  }
}

export class FFmpegWorker {
  private FFMessageType = {
    LOAD: 'LOAD',
    EXEC: 'EXEC',
    WRITE_FILE: 'WRITE_FILE',
    READ_FILE: 'READ_FILE',
    DELETE_FILE: 'DELETE_FILE',
    RENAME: 'RENAME',
    CREATE_DIR: 'CREATE_DIR',
    LIST_DIR: 'LIST_DIR',
    DELETE_DIR: 'DELETE_DIR',
    ERROR: 'ERROR',
    DOWNLOAD: 'DOWNLOAD',
    PROGRESS: 'PROGRESS',
    LOG: 'LOG',
    MOUNT: 'MOUNT',
    UNMOUNT: 'UNMOUNT',
  };

  private ERROR_UNKNOWN_MESSAGE_TYPE = new Error('unknown message type');
  private ERROR_NOT_LOADED = new Error('ffmpeg is not loaded, call `await this.load()` first');
  private ERROR_IMPORT_FAILURE = new Error('failed to import ffmpeg-core.js');

  private ffmpeg: FFmpeg | null = null;

  get loaded(): boolean {
    return this.ffmpeg !== null;
  }

  async load(): Promise<boolean> {
    const firstLoad = !this.ffmpeg;

    self.createFFmpegCore = createFFmpegCore;
    console.log('core', createFFmpegCore);

    // this.ffmpeg.setLogger((data: any) => self.postMessage({ type: this.FFMessageType.LOG, data }));

    return firstLoad;
  }

  exec({ args, timeout = -1 }: ExecOptions): any {
    this.ffmpeg.setTimeout(timeout);
    this.ffmpeg.exec(...args);
    const ret = this.ffmpeg.ret;
    this.ffmpeg.reset();
    return ret;
  }

  writeFile({ path, data }: FileOptions): boolean {
    this.ffmpeg.FS.writeFile(path, data!); // Using '!' as data is required here
    return true;
  }

  readFile({ path, encoding }: FileOptions): any {
    return this.ffmpeg.FS.readFile(path, { encoding });
  }

  deleteFile({ path }: FileOptions): boolean {
    this.ffmpeg.FS.unlink(path);
    return true;
  }

  rename({ oldPath, newPath }: RenameOptions): boolean {
    this.ffmpeg.FS.rename(oldPath, newPath);
    return true;
  }

  createDir({ path }: DirOptions): boolean {
    this.ffmpeg.FS.mkdir(path);
    return true;
  }

  listDir({ path }: DirOptions): { name: string; isDir: boolean }[] {
    const names = this.ffmpeg.FS.readdir(path);
    const nodes: { name: string; isDir: boolean }[] = [];
    for (const name of names) {
      const stat = this.ffmpeg.FS.stat(`${path}/${name}`);
      const isDir = this.ffmpeg.FS.isDir(stat.mode);
      nodes.push({ name, isDir });
    }
    return nodes;
  }

  deleteDir({ path }: DirOptions): boolean {
    this.ffmpeg.FS.rmdir(path);
    return true;
  }

  mount({ fsType, options, mountPoint }: MountOptions): boolean {
    const fs = this.ffmpeg.FS.filesystems[fsType];
    if (!fs) return false;
    this.ffmpeg.FS.mount(fs, options, mountPoint);
    return true;
  }

  unmount({ mountPoint }: MountOptions): boolean {
    this.ffmpeg.FS.unmount(mountPoint);
    return true;
  }

  onMessage = async ({ data: { id, type, data } }) => {
    let response;
    const transferables = [];
    try {
      if (type !== this.FFMessageType.LOAD && !this.ffmpeg) throw this.ERROR_NOT_LOADED;

      switch (type) {
        case this.FFMessageType.LOAD:
          response = await this.load(data);
          break;
        case this.FFMessageType.EXEC:
          response = this.exec(data);
          break;
        case this.FFMessageType.WRITE_FILE:
          response = this.writeFile(data);
          break;
        case this.FFMessageType.READ_FILE:
          response = this.readFile(data);
          break;
        case this.FFMessageType.DELETE_FILE:
          response = this.deleteFile(data);
          break;
        case this.FFMessageType.RENAME:
          response = this.rename(data);
          break;
        case this.FFMessageType.CREATE_DIR:
          response = this.createDir(data);
          break;
        case this.FFMessageType.LIST_DIR:
          response = this.listDir(data);
          break;
        case this.FFMessageType.DELETE_DIR:
          response = this.deleteDir(data);
          break;
        case this.FFMessageType.MOUNT:
          response = this.mount(data);
          break;
        case this.FFMessageType.UNMOUNT:
          response = this.unmount(data);
          break;
        case this.FFMessageType.ERROR:
          throw new Error(data);
        default:
          throw this.ERROR_UNKNOWN_MESSAGE_TYPE;
      }
    } catch (e) {
      self.postMessage({
        id,
        type: this.FFMessageType.ERROR,
        data: e.toString(),
      });
      return;
    }

    if (response instanceof Uint8Array) {
      transferables.push(response.buffer);
    }

    self.postMessage({ id, type, data: response }, transferables);
  };
}

// Usage:
const ffmpegWorker = new FFmpegWorker();
self.onmessage = ffmpegWorker.onMessage;
