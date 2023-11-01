import { Extractor, SeekMethod } from "node-unrar-js";
import { getUnrar } from "node-unrar-js/dist/js/unrar.singleton";
import { BlobReader } from "./BlobReader";

export interface ExtractorFromBlobOptions {
  wasmBinary?: ArrayBuffer;
  file: File;
  password?: string;
}

export async function createExtractorFromBlob({
    wasmBinary,
    file,
    password = ''
  }: ExtractorFromBlobOptions
): Promise<Extractor<Uint8Array>> {
  const unrar = await getUnrar(wasmBinary && { wasmBinary });
  const extractor = new ExtractorBlob(unrar, file, password);
  unrar.extractor = extractor;
  return extractor;
}

export class ExtractorBlob extends Extractor<Uint8Array> {
  protected _filePath: string;

  private fileMap: {
    [fd: number]: {
      fd: number,
      name: string,
      reader: BlobReader,
    }
  };
  private filenameMap: {
    [filename: string]: number
  }

  constructor(unrar: any, file: File, password: string) {
    super(unrar, password);
    this._filePath = '_defaultUnrarJS_.rar';
    this.fileMap = {};
    this.filenameMap = {};

    // fd 1 = _defaultUnrarJS_.rar
    this.fileMap[1] = {
      fd: 1,
      name: this._filePath,
      reader: new BlobReader(file),
    };
    this.filenameMap[this._filePath] = 1;
  }

  protected open(filename: string): number {
    return this.filenameMap[filename];
  }

  protected create(filename: string): number {
    throw new Error("Not implemented: create");
  }

  protected read(fd: number, buf: number, size: number): number {
    const reader = this.fileMap[fd].reader;

    const data = reader.read(size);
    this.unrar.HEAPU8.set(data, buf);
    return data.byteLength;
  }

  protected write(fd: number, buf: number, size: number): boolean {
    throw new Error("Not implemented: write");
  }

  protected tell(fd: number): number {
    return this.fileMap[fd].reader.tell();
  }

  protected seek(fd: number, pos: number, method: SeekMethod): boolean {
    return this.fileMap[fd].reader.seek(pos, method);
  }

  protected closeFile(fd: number): void {
    this.fileMap[fd].reader.seek(0, 'SET');
  }
}