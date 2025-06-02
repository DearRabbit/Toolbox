import * as zip from "@zip.js/zip.js";
import { FileWithPath } from "@mantine/dropzone";

import { arrayBufferToString } from "@/utils/stringhelper";
import { createExtractorFromBlob } from "@/libs/rar/ExtractorBlob"

export type ArchiveType = 'zip' | 'rar' | 'folder';

export interface Archive {
  name: string;
  size: number;
  type: ArchiveType;
  files: FileWithPath[];
};

export interface ArchiveInfo {
  name: string;
  size: number;
  comment: string;
  exts: string[];
  fileCount: number;
  folderCount: number;
};

export class ArchiveInfoReader {
  static _wasmBinary: ArrayBuffer;
  private _archive: Archive;

  static async init() {
    const wasmUrl = new URL('node-unrar-js/dist/js/unrar.wasm', import.meta.url);
    const wasmBinary = await (
      await fetch(wasmUrl, { credentials: 'same-origin' })
    ).arrayBuffer();
    ArchiveInfoReader._wasmBinary = wasmBinary;
    console.log('ArchiveInfoReader initialized');
  }

  static async open(archive: Archive): Promise<ArchiveInfo> {
    if (!ArchiveInfoReader._wasmBinary) {
      await ArchiveInfoReader.init();
    }
    return new ArchiveInfoReader(archive).readArchiveInfo();
  }

  constructor(archive: Archive) {
    this._archive = archive;
  }

  async readArchiveInfo(): Promise<ArchiveInfo> {
    if (this._archive.type === 'zip') {
      return this.readZipfile();
    } else if (this._archive.type === 'rar') {
      return this.readRarFile();
    } else {
      return this.readFolder();
    }
  }

  async readZipfile(): Promise<ArchiveInfo> {
    const reader = new zip.ZipReader(new zip.BlobReader(this._archive.files[0]));

    let fileCount = 0;
    let folderCount = 0;
    let uncompressedSize = 0;
    let extensions = new Set<string>();

    let pathGen = reader.getEntriesGenerator();
    for await (let path of pathGen) {
      if (path.directory) {
        folderCount++;
      } else {
        fileCount++;
        uncompressedSize += path.uncompressedSize;

        const ext = path.filename.split('.').pop();
        if (ext) {
          extensions.add(ext.toLowerCase());
        }
      }
    }
    let comment = arrayBufferToString(reader.comment);
    reader.close();
  
    return {
      name: this._archive.name,
      size: uncompressedSize,
      exts: Array.from(extensions),
      comment,
      fileCount,
      folderCount,
    };
  }

  async readRarFile(): Promise<ArchiveInfo> {
    const extractor = await createExtractorFromBlob({ wasmBinary: ArchiveInfoReader._wasmBinary, file: this._archive.files[0] });
    const { arcHeader, fileHeaders } = extractor.getFileList();

    let fileCount = 0;
    let folderCount = 0;
    let uncompressedSize = 0;
    let extensions = new Set<string>();

    for (let file of fileHeaders) {
      if (file.flags.directory) {
        folderCount++;
      } else {
        fileCount++;
        uncompressedSize += file.unpSize;

        const ext = file.name.split('.').pop();
        if (ext) {
          extensions.add(ext.toLowerCase());
        }
      }
    }

    return {
      name: this._archive.name,
      size: uncompressedSize,
      exts: Array.from(extensions),
      comment: arcHeader.comment, 
      fileCount,
      folderCount,
    };
  }

  async readFolder(): Promise<ArchiveInfo> {
    let extensions = new Set<string>();
    let folderTree = new Map<number, Set<String>>();
    for (let file of this._archive.files) {
      let paths = file.path!.split('/');
      
      // path's like: /subroot/subfolder/file.ext
      // paths[0] is '', paths[1] is subroot (which means _archive.name is subroot)
      // when length > 3, it should have subfolder, and it's depth is 2 
      if (paths.length > 3) {
        for (let depth = 2; depth < paths.length - 1; depth++) {
          if (!folderTree.has(depth)) {
            folderTree.set(depth, new Set<string>());
          }
          folderTree.get(depth)?.add(paths[depth]);
        }
      }

      const ext = file.name.split('.').pop();
      if (ext) {
        extensions.add(ext.toLowerCase());
      }
    }
    let folderCount = 0;
    for (let folders of folderTree.values()) {
      folderCount += folders.size;
    }
    return {
      name: this._archive.name,
      size: this._archive.size,
      exts: Array.from(extensions),
      comment: '',
      fileCount: this._archive.files.length,
      folderCount,
    };
  }

  static async preprocess(files: FileWithPath[]): Promise<Archive[]> {
    let archives: Archive[] = [];
    let others: FileWithPath[] = [];
    for (let file of files) {
      if (file.name.endsWith('.zip') || file.name.endsWith('.cbz') || file.name.endsWith('.epub')) {
        archives.push({ name: file.name, size: file.size, type: 'zip', files: [file] });
      } else if (file.name.endsWith('.rar') || file.name.endsWith('.cbr')) {
        archives.push({ name: file.name, size: file.size, type: 'rar', files: [file] });
      } else {
        others.push(file);
      }
    }

    let folders = new Map<string, FileWithPath[]>();
    for (let file of others) {
      if (!file.path || !file.path.startsWith('/')) {
        continue;
      }
      let paths = file.path.split('/');
      let folder = paths[1];
      if (!folders.has(folder)) {
        folders.set(folder, []);
      }
      folders.get(folder)?.push(file);
    }
    for (let [name, files] of folders) {
      let totalSize = files.reduce((sum, file) => sum + file.size, 0);
      archives.push({ name, size: totalSize, type: 'folder', files });
    }

    return archives;
  }

  async _loadBuffer(): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((r) => {
      const reader = new FileReader();
      reader.addEventListener('load', (event) => {
        r(event.target?.result as ArrayBuffer);
      });
      reader.readAsArrayBuffer(this._archive.files[0]);
    });
  }
}