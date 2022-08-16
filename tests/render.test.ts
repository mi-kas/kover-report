import {describe, test, expect} from '@jest/globals'
import {createComment, renderEmoji} from '../src/render'
import {Coverage, ChangedFilesCoverage} from '../src/types'

describe('Render functions', () => {
  test('render emoji', () => {
    expect(renderEmoji(0.8, 0.7)).toBe(':white_check_mark:|')
    expect(renderEmoji(0.8, 0.8)).toBe(':white_check_mark:|')
    expect(renderEmoji(0.8, 0.9)).toBe(':x:|')
  })

  test('create comment with min coverage values', () => {
    const coverage: Coverage = {missed: 7, covered: 10, percentage: 70.2}
    const changedFilesCoverage: ChangedFilesCoverage = {
      percentage: 65.5,
      files: [
        {
          missed: 7,
          covered: 10,
          percentage: 65.5,
          filePath: 'Details.kt',
          url: 'file-url'
        }
      ]
    }
    const comment = createComment(coverage, changedFilesCoverage, 70.0, 70.0)

    expect(comment).toBe(
      `|File|Coverage [65.50%]|:x:|\n|:-|:-:|:-:|\n|[Details.kt](file-url)|65.50%|:x:|\n\n|Total Project Coverage|70.20%|:white_check_mark:|\n|:-|:-:|:-:|`
    )
  })

  test('create comment without min coverage values', () => {
    const coverage: Coverage = {missed: 7, covered: 10, percentage: 70.2}
    const changedFilesCoverage: ChangedFilesCoverage = {
      percentage: 65.5,
      files: [
        {
          missed: 7,
          covered: 10,
          percentage: 65.5,
          filePath: 'Details.kt',
          url: 'file-url'
        }
      ]
    }
    const comment = createComment(
      coverage,
      changedFilesCoverage,
      undefined,
      undefined
    )

    expect(comment).toBe(
      `|File|Coverage [65.50%]|\n|:-|:-:|\n|[Details.kt](file-url)|65.50%|\n\n|Total Project Coverage|70.20%|\n|:-|:-:|`
    )
  })

  test('create comment with no changed files', () => {
    const coverage: Coverage = {missed: 7, covered: 10, percentage: 70.2}
    const changedFilesCoverage: ChangedFilesCoverage = {
      percentage: 65.5,
      files: []
    }
    const comment = createComment(
      coverage,
      changedFilesCoverage,
      undefined,
      undefined
    )

    expect(comment).toBe(`|Total Project Coverage|70.20%|\n|:-|:-:|`)
  })
})
