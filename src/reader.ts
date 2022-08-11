import * as fs from 'fs'
import * as parser from 'xml2js'

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

export const getReportCoverage = async (
  path: string
): Promise<Coverage | null> => {
  const report = await parseXmlReport(path)

  return getCoverage(report)
}

const parseXmlReport = async (xmlPath: string): Promise<Report> => {
  const reportXml = await fs.promises.readFile(xmlPath.trim(), 'utf-8')
  return parser.parseStringPromise(reportXml)
}

const getCoverage = (report: Report): Coverage | null => {
  const counters = report['report']['counter']

  const lineCounter = counters.find(
    counter => counter['$']['type'] === 'LINE'
  )?.['$']
  if (!lineCounter) return null

  const missed = parseFloat(lineCounter['missed'])
  const covered = parseFloat(lineCounter['covered'])

  return {
    missed,
    covered,
    percentage: parseFloat(((covered / (covered + missed)) * 100).toFixed(2))
  }
}
