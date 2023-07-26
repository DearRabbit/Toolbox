import jszip from "jszip";
import { createExtractorFromData } from "node-unrar-js";
import { FileWithPath } from "@mantine/dropzone";

const version = 'moelist v0.0.1';

export type ArchiveType = 'zip' | 'rar' | 'folder';

export interface Archive {
  name: string;
  size: number;
  type: ArchiveType;
  files?: FileWithPath[];
};

export interface ArchiveInfo {
  name: string;
  size: number;
  comment: string;
  exts: string[];
  fileCount: number;
  folderCount: number;
  files?: FileWithPath[];
};

export class ArchiveInfoReader {
  static _wasmBinary: ArrayBuffer;
  private _archive: Archive;

  static async init() {
    const wasmUrl = new URL('node-unrar-js/esm/js/unrar.wasm', import.meta.url);
    const wasmBinary = await (
      await fetch(wasmUrl, { credentials: 'same-origin' })
    ).arrayBuffer();
    ArchiveInfoReader._wasmBinary = wasmBinary;
    console.log('ArchiveInfoReader initialized');
  }

  static async open(archive: Archive): Promise<ArchiveInfo> {
    return new ArchiveInfoReader(archive).readArchiveInfo();
  }

  constructor(archive: Archive) {
    if (!ArchiveInfoReader._wasmBinary) {
      ArchiveInfoReader.init();
    }
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
    const zip = await jszip.loadAsync(this._archive.files![0]);
    const paths = Object.keys(zip.files);

    // @ts-ignore
    let comment: string = zip.comment || '';

    let fileCount = 0;
    let folderCount = 0;
    let extensions = new Set<string>();
  
    for (let path of paths) {
      if (path.endsWith('/')) {
        folderCount++;
      } else {
        fileCount++;
  
        const ext = path.split('.').pop();
        if (ext) {
          extensions.add(ext);
        }
      }
    }
  
    return {
      name: this._archive.name,
      size: this._archive.size,
      exts: Array.from(extensions),
      comment,
      fileCount,
      folderCount,
    };
  }

  async readRarFile(): Promise<ArchiveInfo> {
    const data = await this._loadBuffer();
    const extractor = await createExtractorFromData({ wasmBinary: ArchiveInfoReader._wasmBinary, data });
    const { arcHeader, fileHeaders } = extractor.getFileList();

    let fileCount = 0;
    let folderCount = 0;
    let extensions = new Set<string>();

    for (let file of fileHeaders) {
      if (file.flags.directory) {
        folderCount++;
      } else {
        fileCount++;

        const ext = file.name.split('.').pop();
        if (ext) {
          extensions.add(ext);
        }
      }
    }

    return {
      name: this._archive.name,
      size: this._archive.size,
      exts: Array.from(extensions),
      comment: arcHeader.comment, 
      fileCount,
      folderCount,
    };
  }

  async readFolder(): Promise<ArchiveInfo> {
    let extensions = new Set<string>();
    let folderTree = new Map<number, Set<String>>();
    for (let file of this._archive.files!) {
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
        extensions.add(ext);
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
      fileCount: this._archive.files!.length,
      folderCount,
    };
  }

  static async preprocess(files: FileWithPath[]): Promise<Archive[]> {
    let archives: Archive[] = [];
    let others: FileWithPath[] = [];
    for (let file of files) {
      if (file.name.endsWith('.zip')) {
        archives.push({ name: file.name, size: file.size, type: 'zip', files: [file] });
      } else if (file.name.endsWith('.rar')) {
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
      reader.readAsArrayBuffer(this._archive.files![0]);
    });
  }
}

export const ForumList = [
  '中文漫画原创区',
  '非单行本分享区',
  '自制漫画分享区',
  '实体首发补档区',
  '实体二次分流区',
  '繁体中文电子版',
  '简体中文电子版',
  '外文原版分享区',
];
export type SizeType = 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';

export class MoelistFormatter {
  static getSizeType(size: number): SizeType {
    let sizeMB = size / 1024 / 1024;
    if (sizeMB < 20) return 'XXS';
    if (sizeMB < 50) return 'XS';
    if (sizeMB < 100) return 'S';
    if (sizeMB < 175) return 'M';
    if (sizeMB < 300) return 'L';
    if (sizeMB < 500) return 'XL';
    if (sizeMB < 800) return 'XXL';
    return 'XXXL';
  }

  static getDefaultBonus(sizeType: SizeType): number {
    switch (sizeType) {
      case 'XXS': return 2;
      case 'XS': return 4;
      case 'S': return 5;
      case 'M': return 6;
      case 'L': return 8;
      case 'XL': return 10;
      case 'XXL': return 13;
      case 'XXXL': return 16;
    }
  }

  private static getBonusWithRule(info: ArchiveInfo, forum: string): number {
    let bonus = MoelistFormatter.getDefaultBonus(MoelistFormatter.getSizeType(info.size));
    if (forum === '外文原版分享区') {
      let sizeBonus = info.size / 1024 / 1024 / 10;
      let pageBonus = info.fileCount / 10;
      return 0.7 * sizeBonus + 0.3 * pageBonus;
    }
    return bonus;
  }
  
  static getPreviewStyle(infos: ArchiveInfo[], forum: string): string {
    if (infos.length === 0) return '';
  
    let header = '        Size Type Summary                  Extensions       Comment              Name';
    let divider = ['-'.repeat(12), '-'.repeat(4), '-'.repeat(24), '-'.repeat(16), '-'.repeat(20), '-'.repeat(24)].join(' ');

    let totalSize = 0;
    let totalFiles = 0;
    let totalFolders = 0;
    let totalBonus = 0;

    let lines = [version, header, divider];
    for (let info of infos) {
      let size = info.size.toLocaleString();
      let type = MoelistFormatter.getSizeType(info.size);

      let fileCount = info.fileCount;
      let folderCount = info.folderCount;
      let summary = `${fileCount} files, ${folderCount} folders`;
      let extensions = info.exts.join(', ');
      let name = info.name;
      let comment = info.comment;

      let line = `${size.padStart(12)} ${type.padStart(4)} ${summary.padEnd(24)} ${extensions.padEnd(16)} ${comment.padEnd(20)} ${name}`;
      lines.push(line);

      totalSize += info.size;
      totalFiles += fileCount;
      totalFolders += folderCount;
      totalBonus += MoelistFormatter.getBonusWithRule(info, forum);
    }
    lines.push(divider);
    lines.push(`${totalSize.toLocaleString().padStart(12)}      ${totalFiles} files, ${totalFolders} folders`);
    lines.push(`MB Reward in ${forum}: ${totalBonus.toFixed(2)}`);  
    return lines.join('\n');
  }

  static getCodeStyle(infos: ArchiveInfo[], forum: string): string {
    if (infos.length === 0) return '';

    let quoteStart = '[quote][font=courier new, courier, monospace]';
    let quoteEnd = '[/font][/quote]';
    let content = MoelistFormatter.getPreviewStyle(infos, forum);
    let lines = [quoteStart, content, quoteEnd];

    return lines.join('\n');
  }
  
  static getTableStyle(infos: ArchiveInfo[], forum: string): string {
    if (infos.length === 0) return '';

    let quoteStart = '[quote]';
    let quoteEnd = '[/quote]';
    let tableStart = '[table=100%][tr]'+
                    '[td]档案[/td]'+
                    '[td][align=right]体积[/align][/td]'+
                    '[td][align=right]体积类型[/align][/td]'+
                    '[td][align=right]文件数[/align][/td]'+
                    '[td][align=right]文件夹数[/align][/td]'+
                    '[td]备注[/td][/tr]';
                    '[td]扩展名[/td][/tr]';

    let totalSize = 0;
    let totalFiles = 0;
    let totalFolders = 0;
    let totalBonus = 0;

    let lines = [quoteStart, version, tableStart];
    for (let info of infos) {
      let size = info.size.toLocaleString();
      let type = MoelistFormatter.getSizeType(info.size);

      let fileCount = info.fileCount;
      let folderCount = info.folderCount;
      let extensions = info.exts.join(', ');
      let name = info.name;
      let comment = info.comment;

      let line = `[tr][td]${name}[/td]`+
                 `[td][align=right]${size}[/align][/td]`+
                 `[td][align=right]${type}[/align][/td]`+
                 `[td][align=right]${fileCount}[/align][/td]`+
                 `[td][align=right]${folderCount}[/align][/td]`+
                 `[td]${comment}[/td]`+
                 `[td]${extensions}[/td][/tr]`;
      lines.push(line);

      totalSize += info.size;
      totalFiles += fileCount;
      totalFolders += folderCount;
      totalBonus += MoelistFormatter.getBonusWithRule(info, forum);
    }
    let counter = `[tr][td]总计[/td]`+
                  `[td][align=right]${totalSize.toLocaleString()}[/align][/td]`+
                  `[td][/td]`+
                  `[td][align=right]${totalFiles}[/align][/td]`+
                  `[td][align=right]${totalFolders}[/align][/td]`+
                  `[td][/td][td][/td][/tr]`;
    lines.push(counter);
    lines.push(`[tr][td]MB奖励 ${forum}[/td][td][align=right]${totalBonus.toFixed(2)}[/align][/td][/tr]`);  

    lines.push('[/table]');
    lines.push(quoteEnd);
    return lines.join('\n');
  }
}

