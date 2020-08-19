export const alioss = require('ali-oss')
export const path = require('path')
export const fs = require('fs')

let allNumber = 0
let tmpNumber = 0
let sucNumber = 0
let retNumber = 0
let sizeNumber = 0

interface IOssutilConfig {
  accessKeyId: string,
  accessKeySecret: string,
  bucket: string,
  region: string,
  releaseEnvConf: any,
  source: string,
  target: string
}

export function upload (aliossConfig: IOssutilConfig) {
  const client = new alioss(aliossConfig)
  console.log(`[alioss-cli] START UPLOADING... oss://${aliossConfig.bucket}/${aliossConfig.target}`)
  const list = _list(path.posix.join(process.cwd(), aliossConfig.source))
  allNumber = list.length
  if (list.length > 0) {
    list.forEach(item => {
      _upload(item, aliossConfig, client)
    })
  } else {
    _result()
  }
}

function _result() {
  if (allNumber === tmpNumber) {
    console.log(`[alioss-cli] RESULT :   ${_renderSize(sizeNumber)} - [ SIZE ]   ${allNumber} - [ ALL ]   ${sucNumber} - [ SUCCESS ]   ${retNumber} - [ RETRY ]`)
  }
}

function _upload(item: any, aliossConfig: IOssutilConfig, client: any, retry = true) {
  client.put(`${aliossConfig.target}${item.relative}`, item.file).then(() => {
    sucNumber++
    tmpNumber++
    sizeNumber += item.size
    console.log(`[alioss-cli] 【 ${item.file} 】SUCCESS   ✔ 【${_renderSize(item.size)}】`)
    _result()
  }).catch(() => {
    if (retry) {
      _upload(item, aliossConfig, client, false)
    } else {
      retNumber++
      tmpNumber++
      console.log(`[alioss-cli] 【 ${item.file} 】FAILURE   ✘ `)
      _result()
    }
  })
}

function _list(src: string) {
  let entrysList: any[] = []
  const fetchFile = (file: string) => {
    if (!fs.existsSync(file)) {
      return
    }
    let fileStat = fs.statSync(file)
    if (fileStat.isDirectory()) {
      const fileList = fs.readdirSync(file)
      if (!fileList.length) {
        return
      }
      fileList.forEach((item: string) => {
        fetchFile(path.posix.join(file, `./${item}`))
      })
    } else {
      entrysList.push({ file, relative: path.posix.relative(src, file), size: fileStat.size })
    }
  }
  fetchFile(src)
  return entrysList
}

function _renderSize(value: any) {
  if (null == value || value == '') {
    return "0 Bytes"
  }
  let unitArr = new Array("Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
  let index = 0
  let srcsize = parseFloat(value)
  index = Math.floor(Math.log(srcsize) / Math.log(1024))
  let size: any = srcsize / Math.pow(1024, index)
  size = size.toFixed(2)
  return size + unitArr[index]
}