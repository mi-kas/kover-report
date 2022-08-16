import {describe, test, expect} from '@jest/globals'
import {
  parseReport,
  getCoverageFromCounters,
  getOverallCoverage,
  getTotalPercentage
} from '../src/reader'
import {Report, ChangedFileWithCoverage} from '../src/types'

describe('Reader functions', () => {
  const sampleReport: Report = {
    report: {
      $: {name: 'Intellij Coverage Report'},
      counter: [
        {$: {type: 'INSTRUCTION', missed: '7418', covered: '25767'}},
        {$: {type: 'BRANCH', missed: '665', covered: '874'}},
        {$: {type: 'LINE', missed: '900', covered: '3346'}},
        {$: {type: 'METHOD', missed: '230', covered: '602'}},
        {$: {type: 'CLASS', missed: '160', covered: '330'}}
      ]
    }
  }

  test('parse kover report from xml file', async () => {
    const report = await parseReport('./tests/examples/report.xml')
    expect(report).toMatchObject(sampleReport as Record<string, any>)
  })

  test('get coverage from counters', () => {
    const coverage = getCoverageFromCounters(sampleReport.report.counter!!)
    expect(coverage).toMatchObject({
      missed: 900,
      covered: 3346,
      percentage: 78.8
    })
  })

  test('get coverage from counters returns null if no line counters', () => {
    const coverage = getCoverageFromCounters(
      sampleReport.report.counter!!.filter(c => c.$.type !== 'LINE')
    )
    expect(coverage).toBeNull()
  })

  test('get overall coverage from report', () => {
    const coverage = getOverallCoverage(sampleReport)
    expect(coverage).toMatchObject({
      missed: 900,
      covered: 3346,
      percentage: 78.8
    })
  })

  test('get overall coverage from report returns null if no counters', () => {
    const coverage = getOverallCoverage({
      ...sampleReport,
      report: {...sampleReport.report, counter: undefined}
    })
    expect(coverage).toBeNull()
  })

  test('get total percentage from changed files', () => {
    const files: ChangedFileWithCoverage[] = [
      {
        filePath: 'Details.kt',
        url: 'file-url-detail',
        missed: 250,
        covered: 1000,
        percentage: 80.0
      },
      {
        filePath: 'Util.kt',
        url: 'file-url-url',
        missed: 1000,
        covered: 1000,
        percentage: 50.0
      }
    ]
    const percentage = getTotalPercentage(files)
    expect(percentage).toBe(61.54)
  })

  test('get total percentage from empty changed files', () => {
    const percentage = getTotalPercentage([])
    expect(percentage).toBeNull()
  })
})
