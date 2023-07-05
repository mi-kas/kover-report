import {describe, expect, test} from '@jest/globals'
import {createComment, renderEmoji} from '../src/render'
import {ChangedFilesCoverage, Coverage} from '../src/types'

describe('Render functions', () => {
  test('render emoji', () => {
    expect(renderEmoji(0.8, 0.7)).toBe(':white_check_mark:|')
    expect(renderEmoji(0.8, 0.8)).toBe(':white_check_mark:|')
    expect(renderEmoji(0.8, 0.9)).toBe(':hankey:|')
  })

  test('create comment with title', () => {
    const coverage: Coverage = {missed: 7, covered: 10, percentage: 70.2}
    const changedFilesCoverage: ChangedFilesCoverage = {
      percentage: 65.5,
      files: [
        {
          missed: 7,
          covered: 10,
          percentage: 65.5,
          filePath: 'path/to/file/Details.kt',
          url: 'file-url'
        }
      ]
    }
    const comment = createComment(
      'Code Coverage',
      coverage,
      changedFilesCoverage,
      70.0,
      70.0
    )

    const expectedComment = `### Code Coverage
|File|Coverage [65.50%]|:-:|
|:-|:-:|:-:|
|[Details.kt](file-url)|65.50%|:hankey:|

|Total Project Coverage|70.20%|:white_check_mark:|
|:-|:-:|:-:|`

    expect(comment).toBe(expectedComment)
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
    const comment = createComment(
      undefined,
      coverage,
      changedFilesCoverage,
      70.0,
      70.0
    )

    const expectedComment = `|File|Coverage [65.50%]|:-:|
|:-|:-:|:-:|
|[Details.kt](file-url)|65.50%|:hankey:|

|Total Project Coverage|70.20%|:white_check_mark:|
|:-|:-:|:-:|`
    expect(comment).toBe(expectedComment)
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
      undefined,
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
      undefined,
      coverage,
      changedFilesCoverage,
      undefined,
      undefined
    )

    expect(comment).toBe(`|Total Project Coverage|70.20%|\n|:-|:-:|`)
  })
})
