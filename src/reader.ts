import * as fs from 'fs'
import * as parser from 'xml2js'
import {ChangedFile} from './action'

type Counter = {
  $: {
    type: 'INSTRUCTION' | 'BRANCH' | 'LINE' | 'METHOD' | 'CLASS'
    missed: string
    covered: string
  }
}

type Class = {
  $: {
    name: string
    sourcefilename: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  method: any[]
  counter: Counter[]
}

type SourceFile = {
  $: {
    name: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  line: any[]
  counter: Counter[]
}

type Package = {
  $: {
    name: string
  }
  class: Class[]
  sourcefile: SourceFile[]
  counter: Counter[]
}

type Report = {
  report: {
    $: {
      name: string
    }
    package: Package[]
    counter: Counter[]
  }
}

export type Coverage = {
  missed: number
  covered: number
  percentage: number
}

export type ChangedFileWithCoverage = Coverage & ChangedFile

export const parseReport = async (path: string): Promise<Report | null> => {
  const report = await parseXmlReport(path)

  return report
}

const parseXmlReport = async (xmlPath: string): Promise<Report> => {
  const reportXml = await fs.promises.readFile(xmlPath.trim(), 'utf-8')
  return parser.parseStringPromise(reportXml)
}
const getCoverageFromCounters = (counters: Counter[]): Coverage | null => {
  const lineCounter = counters.find(counter => counter['$'].type === 'LINE')?.[
    '$'
  ]
  if (!lineCounter) return null

  const missed = parseFloat(lineCounter.missed)
  const covered = parseFloat(lineCounter.covered)

  return {
    missed,
    covered,
    percentage: parseFloat(((covered / (covered + missed)) * 100).toFixed(2))
  }
}

export const getOverallCoverage = (report: Report): Coverage | null => {
  return getCoverageFromCounters(report.report.counter)
}

export const getFileCoverage = (
  report: Report,
  files: ChangedFile[]
): {percentage: number; files: ChangedFile[]} => {
  const filesWithCoverage = files.reduce<ChangedFileWithCoverage[]>(
    (acc, file) => {
      report.report.package.map(item => {
        const packageName = item['$'].name
        const sourceFile = item.sourcefile.find(sf => {
          const sourceFileName = sf['$'].name
          return file.filePath.endsWith(`${packageName}/${sourceFileName}`)
        })
        if (sourceFile) {
          const coverage = getCoverageFromCounters(sourceFile.counter)
          if (coverage) acc.push({...file, ...coverage})
        }
      })
      return acc
    },
    []
  )

  return {
    files: filesWithCoverage,
    percentage:
      filesWithCoverage.length > 0 ? getTotalPercentage(filesWithCoverage) : 100
  }
}

const getTotalPercentage = (files: ChangedFileWithCoverage[]): number => {
  const result = files.reduce<{missed: number; covered: number}>(
    (acc, file) => ({
      missed: acc.missed + file.missed,
      covered: acc.covered + file.covered
    }),
    {missed: 0, covered: 0}
  )

  return parseFloat(
    ((result.covered / (result.covered + result.missed)) * 100).toFixed(2)
  )
}
