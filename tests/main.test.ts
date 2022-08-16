import * as core from '@actions/core'
import {describe, test, jest} from '@jest/globals'

jest.mock('@actions/core')
jest.mock('@actions/github')

describe('Run main', () => {
  test('test run in main', async () => {
    // const core = {
    //   getInput: jest.fn().mockReturnValueOnce('my-value')
    // }
    // await run(core)
    // expect(getInputMock).toHaveBeenCalledWith('path', {required: true})
    // expect(getInputMock).toHaveBeenCalledWith('token', {required: true})
    // expect(getInputMock).toHaveBeenCalledWith('title', {required: false})
    // expect(getInputMock).toHaveBeenCalledWith('min-coverage-overall', {
    //   required: false
    // })
    // expect(getInputMock).toHaveBeenCalledWith('min-coverage-changed-files', {
    //   required: false
    // })
  })
})
