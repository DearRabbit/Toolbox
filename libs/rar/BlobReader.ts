import { SeekMethod } from "node-unrar-js";

export class BlobReader{
  private file: File;

  private pos: number;
  private size: number;

  constructor(file: File){
    this.file = file;
    this.pos = 0;
    this.size = file.length;
  }

  public read(size: number): Uint8Array {
    // @ts-ignore
    const reader = new FileReaderSync();
    const slice = this.file.slice(this.pos, this.pos + size);

    this.pos += size;
    return new Uint8Array(reader.readAsArrayBuffer(slice));
  }

  public tell(): number {
    return this.pos;
  }

  public seek(pos: number, method: SeekMethod): boolean {
    let newPos = this.pos;
    if (method === 'SET') {
      newPos = pos;
    } else if (method === 'CUR') {
      newPos += pos;
    } else {
      newPos = this.size - pos;
    }
    if (newPos < 0 || newPos > this.size) {
      return false;
    }
    this.pos = newPos;
    return true;
  }
}