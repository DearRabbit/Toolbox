import { truncateString } from "@/utils/stringhelper";
import { ArchiveInfo } from "./archive";

const version = 'v0.0.1';

export const ForumList = [
  '外文原版分享区',
  '中文实体分流区',
];
export type SizeType = 'XXS' | 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
export interface Bonus{
  name: string;
  base: number;
  extra: number;
};

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

  static hasNonImageExtention(info: ArchiveInfo): boolean {
    const whitelist = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'];
    return info.exts.some(ext => !whitelist.includes(ext));
  }

  static hasProperComment(info: ArchiveInfo): boolean {
    return info.comment.toLowerCase().endsWith('moeshare');
  }

  private static getBonusWithRule(info: ArchiveInfo, forum: string): Bonus[] {
    let bonus = MoelistFormatter.getDefaultBonus(MoelistFormatter.getSizeType(info.size));
    if (forum === '外文原版分享区') {
      let sizeMB = info.size / 1024 / 1024;
      let sizeBonus = sizeMB / 200 * 5;
      let pageBonus = info.fileCount / 200 * 5;
      
      let baseBonus = 0.75 * sizeBonus + 0.25 * pageBonus;
      let extraBonus = baseBonus * 0.3;
      return [
        { name: '外文首发', base: baseBonus, extra: extraBonus },
        { name: '外文二次分流', base: baseBonus * 0.25, extra: extraBonus * 0.25}
      ];
    }
    if (forum === '中文实体分流区') {
      let baseBonus = bonus;
      let extraBonus = baseBonus * 0.3;
      return [
        { name: '实体首发', base: baseBonus, extra: extraBonus },
        { name: '实体二次分流', base: baseBonus * 0.25, extra: extraBonus * 0.25}
      ];
    }

    return []
  }

  private static getTotalBonus(infos: ArchiveInfo[], forums: string[]): Bonus[] {
    let result = new Map<string, Bonus>();
    for (let forum of forums) {
      for (let info of infos) {
        let bonus = MoelistFormatter.getBonusWithRule(info, forum);
        for (let b of bonus) {
          if (!result.has(b.name)) {
            result.set(b.name, { name: b.name, base: 0, extra: 0 });
          }
          let total = result.get(b.name);
          total!.base += b.base;
          total!.extra += b.extra;
        }        
      }
    }
    return Array.from(result.values());
  }
  
  static getPreviewStyle(infos: ArchiveInfo[], forums: string[]): string {
    if (infos.length === 0) return '';
  
    let header = '   体积(M) 类型 文件数量                 扩展名           标签                 档案名';
    let divider = ['-'.repeat(10), '-'.repeat(4), '-'.repeat(24), '-'.repeat(16), '-'.repeat(20), '-'.repeat(24)].join(' ');

    let lines = [`moelist ${version}`, header, divider];
    for (let info of infos) {
      let size = (info.size / 1024 / 1024).toFixed(2);
      let type = MoelistFormatter.getSizeType(info.size);

      let fileCount = info.fileCount;
      let folderCount = info.folderCount;
      let summary = `${fileCount} files, ${folderCount} folders`;
      let extensions = info.exts.join(', ');
      let name = info.name;
      let comment = truncateString(info.comment, 16);

      let line = `${size.padStart(10)} ${type.padStart(4)} ${summary.padEnd(24)} ${extensions.padEnd(16)} ${comment.padEnd(20)} ${name}`;
      lines.push(line);
    }
    lines.push(divider);

    let totalSize = infos.reduce((sum, info) => sum + info.size, 0);
    let totalFiles = infos.reduce((sum, info) => sum + info.fileCount, 0);
    let totalFolders = infos.reduce((sum, info) => sum + info.folderCount, 0);
    lines.push(`${(totalSize / 1024 / 1024).toFixed(2).padStart(10)}      ${totalFiles} files, ${totalFolders} folders`);

    let bonusList = MoelistFormatter.getTotalBonus(infos, forums);
    for (let bonus of bonusList) {
      lines.push(`${bonus.name}MB奖励: ${Math.ceil(bonus.base)} + ${Math.ceil(bonus.extra)}`);
    }

    return lines.join('\n');
  }

  static getCodeStyle(infos: ArchiveInfo[], forums: string[]): string {
    if (infos.length === 0) return '';

    let quoteStart = '[quote][font=黑体]';
    let quoteEnd = '[/font][/quote]';
    let content = MoelistFormatter.getPreviewStyle(infos, forums);
    
    // Format 'version'
    content = content.replace(`moelist ${version}`, `moelist [color=red][b]${version}[/b][/color]`);
    let lines = [quoteStart, content, quoteEnd];

    return lines.join('\n');
  }
  
  static getTableStyle(infos: ArchiveInfo[], forums: string[]): string {
    if (infos.length === 0) return '';

    let quoteStart = '[quote]';
    let quoteEnd = '[/quote]';
    let tableStart = '[table=100%][tr]'+
                    '[td]档案[/td]'+
                    '[td][align=right]体积(M)[/align][/td]'+
                    '[td][align=right]体积类型[/align][/td]'+
                    '[td][align=right]文件数[/align][/td]'+
                    '[td][align=right]文件夹数[/align][/td]'+
                    '[td]标签[/td]' +
                    '[td]扩展名[/td][/tr]';

    let typeCounter = new Map<SizeType, number>();

    let lines = [quoteStart, `moelist [color=red][b]${version}[/b][/color]`, tableStart];
    for (let info of infos) {
      let size = (info.size / 1024 / 1024).toFixed(2);
      let type = MoelistFormatter.getSizeType(info.size);

      let fileCount = info.fileCount;
      let folderCount = info.folderCount;
      let extensions = info.exts.join(', ');
      let name = info.name;
      let comment = truncateString(info.comment, 30);

      let line = `[tr][td]${name}[/td]`+
                 `[td][align=right]${size}[/align][/td]`+
                 `[td][align=right]${type}[/align][/td]`+
                 `[td][align=right]${fileCount}[/align][/td]`+
                 `[td][align=right]${folderCount}[/align][/td]`+
                 `[td]${comment}[/td]`+
                 `[td]${extensions}[/td][/tr]`;
      lines.push(line);

      typeCounter.set(type, (typeCounter.get(type) || 0) + 1);
    }
    let totalSize = infos.reduce((sum, info) => sum + info.size, 0);
    let totalFiles = infos.reduce((sum, info) => sum + info.fileCount, 0);
    let totalFolders = infos.reduce((sum, info) => sum + info.folderCount, 0);

    let counter = `[tr][td]总计[/td]`+
                  `[td][align=right]${(totalSize / 1024 / 1024).toFixed(2)}[/align][/td]`+
                  `[td][/td]`+
                  `[td][align=right]${totalFiles}[/align][/td]`+
                  `[td][align=right]${totalFolders}[/align][/td]`+
                  `[td][/td][td][/td][/tr]`;
    lines.push(counter);
    lines.push('[/table]');

    let typeCounterTable = [];
    typeCounterTable.push('[table=40%][tr]');
    for (let [type, _] of typeCounter) {
      typeCounterTable.push(`[td]${type}[/td]`);
    }
    typeCounterTable.push('[td]总共[/td][/tr]');
    typeCounterTable.push('[tr]');
    for (let [_, count] of typeCounter) {
      typeCounterTable.push(`[td]${count}[/td]`);
    }
    typeCounterTable.push(`[td]${infos.length}[/td][/tr]`);
    typeCounterTable.push('[/table]');
    lines.push(typeCounterTable.join(''));

    lines.push('[table=40%][tr][td]MB奖励建议[/td][td]带标签[/td][td]不带标签[/td][/tr]');
    let bonusList = MoelistFormatter.getTotalBonus(infos, forums);
    for (let bonus of bonusList) {
      lines.push(`[tr][td]${bonus.name}[/td][td]${Math.ceil(bonus.base+bonus.extra)}[/td][td]${Math.ceil(bonus.base)}[/td][/tr]`);
    }
    lines.push('[/table]');

    lines.push(quoteEnd);
    return lines.join('\n');
  }
}
