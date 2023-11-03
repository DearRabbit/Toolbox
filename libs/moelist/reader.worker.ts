import { ArchiveInfoReader } from "./archive";

self.onmessage = async (e) => {
  if (e.data.type == 'read') {
    let files = e.data.files;
    await readArchives(files);
  }
}

async function readArchives(files: File[]) {
  let archives = await ArchiveInfoReader.preprocess(files);

  let infos = [];
  for (let archive of archives) {
    try {
      let info = await ArchiveInfoReader.open(archive);
      infos.push(info);
    } catch (e: any) {
      self.postMessage({ type: 'error', error: e });
    }
  }
  self.postMessage({ type: 'result', infos });
}