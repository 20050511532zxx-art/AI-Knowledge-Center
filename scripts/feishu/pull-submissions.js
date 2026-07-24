import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import * as lark from "@larksuiteoapi/node-sdk"
import dotenv from "dotenv"

dotenv.config({ quiet: true })

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, "..", "..")
const runtimeRoot = path.join(projectRoot, ".runtime", "feishu")

function resolveProjectPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value)
}

function parseArguments(argumentsList) {
  const options = {
    dryRun: false,
    fixturePath: null,
    fieldConfigPath: path.join(projectRoot, "config", "feishu-fields.json"),
    inboxPath: path.join(runtimeRoot, "inbox"),
    statePath: path.join(runtimeRoot, "sync-state.json"),
  }
  const valueOptions = {
    "--fixture": "fixturePath",
    "--fields": "fieldConfigPath",
    "--inbox": "inboxPath",
    "--state": "statePath",
  }

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index]
    if (argument === "--dry-run") {
      options.dryRun = true
    } else if (argument === "--help") {
      options.help = true
    } else if (valueOptions[argument]) {
      const value = argumentsList[index + 1]
      if (!value) throw new Error(`${argument} 缺少参数值`)
      options[valueOptions[argument]] = resolveProjectPath(value)
      index += 1
    } else {
      throw new Error(`未知参数：${argument}`)
    }
  }

  return options
}

function printHelp() {
  console.log(`飞书多维表增量读取工具

用法：node scripts/feishu/pull-submissions.js [选项]

  --dry-run          读取并比较数据，但不写入文件
  --fixture <path>   使用本地 JSON 测试数据，不连接飞书
  --fields <path>    指定字段映射 JSON
  --inbox <path>     指定原始记录输出目录
  --state <path>     指定同步状态文件
  --help             显示帮助`)
}

async function readJson(filePath, fallbackValue) {
  try {
    const content = await fs.readFile(filePath, "utf8")
    return JSON.parse(content.replace(/^\uFEFF/, ""))
  } catch (error) {
    if (error.code === "ENOENT" && fallbackValue !== undefined) return fallbackValue
    throw new Error(`无法读取 JSON 文件 ${filePath}：${error.message}`)
  }
}

function requireEnvironmentVariables(names) {
  const missing = names.filter((name) => !process.env[name]?.trim())
  if (missing.length > 0) throw new Error(`缺少环境变量：${missing.join(", ")}`)
}

function normalizeValue(value) {
  if (value === null || value === undefined) return null
  if (Array.isArray(value)) return value.map(normalizeValue)
  if (typeof value !== "object") return value

  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, normalizeValue(nestedValue)]),
  )
}

function hasValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === "string") return value.trim().length > 0
  if (Array.isArray(value)) return value.some(hasValue)
  if (typeof value === "object") return Object.values(value).some(hasValue)
  return true
}

function selectFields(fields, fieldConfig) {
  return Object.fromEntries(
    Object.entries(fieldConfig).map(([name, feishuName]) => [
      name,
      normalizeValue(fields[feishuName]),
    ]),
  )
}

function createHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function normalizeRecord(record, fieldConfig, fetchedAt) {
  const recordId = record.record_id || record.recordId
  if (!recordId) throw new Error("飞书记录缺少 record_id")

  const fields = selectFields(record.fields || {}, fieldConfig)
  const modifiedTime =
    record.last_modified_time || record.modified_time || record.modifiedTime || null

  return {
    schemaVersion: 1,
    recordId,
    createdTime: record.created_time || record.createdTime || null,
    modifiedTime,
    fetchedAt,
    fields,
    sourceFields: normalizeValue(record.fields || {}),
    contentHash: createHash({ modifiedTime, fields }),
  }
}

async function fetchAllRecords() {
  requireEnvironmentVariables([
    "FEISHU_APP_ID",
    "FEISHU_APP_SECRET",
    "FEISHU_APP_TOKEN",
    "FEISHU_TABLE_ID",
  ])

  const client = new lark.Client({
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET,
  })
  const records = []
  let pageToken

  do {
    const response = await client.bitable.v1.appTableRecord.list({
      path: {
        app_token: process.env.FEISHU_APP_TOKEN,
        table_id: process.env.FEISHU_TABLE_ID,
      },
      params: {
        page_size: 100,
        ...(pageToken ? { page_token: pageToken } : {}),
      },
    })

    if (response.code && response.code !== 0) {
      throw new Error(`飞书接口返回错误 ${response.code}：${response.msg || "未知错误"}`)
    }

    records.push(...(response.data?.items || []))
    if (response.data?.has_more && !response.data?.page_token) {
      throw new Error("飞书返回 has_more，但没有返回 page_token")
    }
    pageToken = response.data?.has_more ? response.data.page_token : undefined
  } while (pageToken)

  return records
}

async function readFixture(fixturePath) {
  const fixture = await readJson(fixturePath)
  if (Array.isArray(fixture)) return fixture
  if (Array.isArray(fixture?.items)) return fixture.items
  if (Array.isArray(fixture?.data?.items)) return fixture.data.items
  throw new Error("测试数据必须是数组，或包含 items/data.items 数组")
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const temporaryPath = `${filePath}.tmp`
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
  await fs.rename(temporaryPath, filePath)
}

async function synchronize(options) {
  const fieldConfig = await readJson(options.fieldConfigPath)
  const previousState = await readJson(options.statePath, {
    schemaVersion: 1,
    lastSuccessfulSync: null,
    records: {},
  })
  const fetchedAt = new Date().toISOString()
  const sourceRecords = options.fixturePath
    ? await readFixture(options.fixturePath)
    : await fetchAllRecords()
  const records = sourceRecords.map((record) => normalizeRecord(record, fieldConfig, fetchedAt))
  const validRecords = records.filter((record) => Object.values(record.fields).some(hasValue))
  const changedRecords = validRecords.filter(
    (record) => previousState.records?.[record.recordId]?.contentHash !== record.contentHash,
  )
  const changedIds = new Set(changedRecords.map((record) => record.recordId))
  const nextState = {
    schemaVersion: 1,
    lastSuccessfulSync: fetchedAt,
    records: { ...(previousState.records || {}) },
  }

  for (const record of validRecords) {
    const fileName = `${record.recordId.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`
    nextState.records[record.recordId] = {
      modifiedTime: record.modifiedTime,
      contentHash: record.contentHash,
      file: fileName,
      lastFetchedAt: fetchedAt,
    }
    if (!options.dryRun && changedIds.has(record.recordId)) {
      await writeJson(path.join(options.inboxPath, fileName), record)
    }
  }

  if (!options.dryRun) await writeJson(options.statePath, nextState)

  return {
    source: options.fixturePath ? "fixture" : "feishu",
    fetched: records.length,
    valid: validRecords.length,
    empty: records.length - validRecords.length,
    changed: changedRecords.length,
    unchanged: validRecords.length - changedRecords.length,
    dryRun: options.dryRun,
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) return printHelp()
  const result = await synchronize(options)
  console.log("飞书数据读取完成")
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(`飞书数据读取失败：${error.message}`)
  process.exitCode = 1
})
