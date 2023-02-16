import * as fs from 'fs'
import * as parser from 'xml2js'
import {
  Report,
  Counter,
  Coverage,
  ChangedFile,
  ChangedFilesCoverage,
  ChangedFileWithCoverage,
  CounterType
} from './types.d'

export const parseReport = async (path: string): Promise<Report | null> => {
  const reportXml = await fs.promises.readFile(path.trim(), 'utf-8')
  return parser.parseStringPromise(reportXml)
}

export const getCoverageFromCounters = (
  counters: Counter[],
  counterType: CounterType
): Coverage | null => {
  const lineCounter = counters.find(
    counter => counter['$'].type === counterType
  )?.['$']
  if (!lineCounter) return null

  const missed = parseFloat(lineCounter.missed)
  const covered = parseFloat(lineCounter.covered)

  return {
    missed,
    covered,
    percentage: parseFloat(((covered / (covered + missed)) * 100).toFixed(2))
  }
}

export const getOverallCoverage = (
  report: Report,
  counterType: CounterType
): Coverage | null => {
  if (!report.report?.counter) return null
  return getCoverageFromCounters(report.report.counter, counterType)
}

export const getFileCoverage = (
  report: Report,
  files: ChangedFile[],
  counterType: CounterType
): ChangedFilesCoverage => {
  const filesWithCoverage = files.reduce<ChangedFileWithCoverage[]>(
    (acc, file) => {
      report.report?.package?.map(item => {
        const packageName = item['$'].name
        const sourceFile = item.sourcefile.find(sf => {
          const sourceFileName = sf['$'].name
          return file.filePath.endsWith(`${packageName}/${sourceFileName}`)
        })
        if (sourceFile?.counter) {
          const coverage = getCoverageFromCounters(
            sourceFile.counter,
            counterType
          )
          if (coverage) acc.push({...file, ...coverage})
        }
      })
      return acc
    },
    []
  )

  return {
    files: filesWithCoverage,
    percentage: getTotalPercentage(filesWithCoverage) ?? 100
  }
}

export const getTotalPercentage = (
  files: ChangedFileWithCoverage[]
): number | null => {
  if (files.length === 0) return null

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
