import {describe, test, expect} from '@jest/globals'
import {
  parseReport,
  getCoverageFromCounters,
  getOverallCoverage,
  getTotalPercentage,
  getFileCoverage
} from '../src/reader'
import {Report, ChangedFileWithCoverage, ChangedFile} from '../src/types'

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

  test('get coverage from line counters', () => {
    const coverage = getCoverageFromCounters(
      sampleReport.report.counter!!,
      'LINE'
    )
    expect(coverage).toMatchObject({
      missed: 900,
      covered: 3346,
      percentage: 78.8
    })
  })

  test('get coverage from branch counters', () => {
    const coverage = getCoverageFromCounters(
      sampleReport.report.counter!!,
      'BRANCH'
    )
    expect(coverage).toMatchObject({
      missed: 665,
      covered: 874,
      percentage: 56.79
    })
  })

  test('get coverage from instruction counters', () => {
    const coverage = getCoverageFromCounters(
      sampleReport.report.counter!!,
      'INSTRUCTION'
    )
    expect(coverage).toMatchObject({
      missed: 7418,
      covered: 25767,
      percentage: 77.65
    })
  })

  test('get coverage from counters returns null if no line counters', () => {
    const coverage = getCoverageFromCounters(
      sampleReport.report.counter!!.filter(c => c.$.type !== 'LINE'),
      'LINE'
    )
    expect(coverage).toBeNull()
  })

  test('get overall coverage from report', () => {
    const coverage = getOverallCoverage(sampleReport, 'LINE')
    expect(coverage).toMatchObject({
      missed: 900,
      covered: 3346,
      percentage: 78.8
    })
  })

  test('get overall coverage from report returns null if no counters', () => {
    const coverage = getOverallCoverage(
      {
        ...sampleReport,
        report: {...sampleReport.report, counter: undefined}
      },
      'LINE'
    )
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

  test('get changed files coverage', () => {
    const changedFiles: ChangedFile[] = [
      {
        filePath: 'com/github/mi-kas/utils/Details.kt',
        url: 'file-url-detail'
      },
      {
        filePath: 'com/github/mi-kas/utils/Util.kt',
        url: 'file-url-util'
      }
    ]
    const report: Report = {
      ...sampleReport,
      report: {
        ...sampleReport.report,
        package: [
          {
            $: {name: 'com/github/mi-kas/utils'},
            class: [],
            sourcefile: [
              {
                $: {name: 'Details.kt'},
                line: [],
                counter: [
                  {
                    $: {
                      type: 'INSTRUCTION',
                      missed: '33',
                      covered: '5'
                    }
                  },
                  {
                    $: {
                      type: 'BRANCH',
                      missed: '2',
                      covered: '0'
                    }
                  },
                  {
                    $: {
                      type: 'LINE',
                      missed: '5',
                      covered: '2'
                    }
                  }
                ]
              },
              {
                $: {name: 'Util.kt'},
                line: [],
                counter: [
                  {
                    $: {
                      type: 'INSTRUCTION',
                      missed: '64',
                      covered: '163'
                    }
                  },
                  {
                    $: {
                      type: 'BRANCH',
                      missed: '9',
                      covered: '3'
                    }
                  },
                  {
                    $: {
                      type: 'LINE',
                      missed: '21',
                      covered: '32'
                    }
                  }
                ]
              },
              {
                $: {name: 'Logger.kt'},
                line: []
              }
            ],
            counter: [
              {
                $: {
                  type: 'INSTRUCTION',
                  missed: '97',
                  covered: '168'
                }
              },
              {$: {type: 'BRANCH', missed: '11', covered: '3'}},
              {$: {type: 'LINE', missed: '26', covered: '34'}},
              {$: {type: 'METHOD', missed: '2', covered: '7'}},
              {$: {type: 'CLASS', missed: '0', covered: '7'}}
            ]
          }
        ]
      }
    }
    const coverage = getFileCoverage(report, changedFiles, 'LINE')
    expect(coverage).toMatchObject({
      files: [
        {
          filePath: 'com/github/mi-kas/utils/Details.kt',
          url: 'file-url-detail',
          missed: 5,
          covered: 2,
          percentage: 28.57
        },
        {
          filePath: 'com/github/mi-kas/utils/Util.kt',
          url: 'file-url-util',
          missed: 21,
          covered: 32,
          percentage: 60.38
        }
      ],
      percentage: 56.67
    })
  })

  test('get changed files coverage on no matching changes', () => {
    const changedFiles: ChangedFile[] = [
      {
        filePath: 'com/github/mi-kas/utils/Details.kt',
        url: 'file-url-detail'
      },
      {
        filePath: 'com/github/mi-kas/utils/Util.kt',
        url: 'file-url-util'
      }
    ]
    const coverage = getFileCoverage(sampleReport, changedFiles, 'LINE')
    expect(coverage).toMatchObject({files: [], percentage: 100.0})
  })
})
