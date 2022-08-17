import {describe, test, expect, jest} from '@jest/globals'
import {addComment, getChangedFiles, getDetails} from '../src/action'

describe('Action functions', () => {
  test('get changed files from context', async () => {
    const compareCommitsMock = jest.fn(() =>
      Promise.resolve({
        data: {
          files: [
            {filename: 'file1', blob_url: 'url1'},
            {filename: 'file2', blob_url: 'url2'}
          ]
        }
      })
    )
    const client = {
      rest: {
        repos: {
          compareCommits: compareCommitsMock
        }
      }
    } as any
    const repo = {
      owner: 'owner',
      repo: 'repo'
    }

    const changedFiles = await getChangedFiles('base', 'head', client, repo)

    expect(compareCommitsMock).toHaveBeenCalledWith({
      base: 'base',
      head: 'head',
      ...repo
    })
    expect(changedFiles).toMatchObject([
      {filePath: 'file1', url: 'url1'},
      {filePath: 'file2', url: 'url2'}
    ])
  })

  test('get changed files from context returns null', async () => {
    const compareCommitsMock = jest.fn(() =>
      Promise.resolve({
        data: {}
      })
    )
    const client = {
      rest: {
        repos: {
          compareCommits: compareCommitsMock
        }
      }
    } as any
    const repo = {
      owner: 'owner',
      repo: 'repo'
    }

    const changedFiles = await getChangedFiles('base', 'head', client, repo)

    expect(compareCommitsMock).toHaveBeenCalledWith({
      base: 'base',
      head: 'head',
      ...repo
    })
    expect(changedFiles.length).toBe(0)
  })

  test('get details from event payload for `pull_request`', () => {
    const payload = {
      pull_request: {
        base: {sha: 'base_sha'},
        head: {sha: 'head_sha'},
        number: 12
      }
    } as any

    const details = getDetails('pull_request', payload)

    expect(details).toMatchObject({
      prNumber: 12,
      base: 'base_sha',
      head: 'head_sha'
    })
  })

  test('get details from event payload for `pull_request_target`', () => {
    const payload = {
      pull_request: {
        base: {sha: 'base_sha'},
        head: {sha: 'head_sha'}
      }
    } as any

    const details = getDetails('pull_request_target', payload)

    expect(details).toMatchObject({
      prNumber: null,
      base: 'base_sha',
      head: 'head_sha'
    })
  })

  test('get details from event payload for `push`', () => {
    const payload = {
      before: 'base_sha',
      after: 'head_sha'
    } as any

    const details = getDetails('push', payload)

    expect(details).toMatchObject({
      prNumber: null,
      base: 'base_sha',
      head: 'head_sha'
    })
  })

  test('get details from event payload throws for other event', () => {
    const payload = {
      before: 'base_sha',
      after: 'head_sha'
    } as any

    expect(() => getDetails('rebase', payload)).toThrowError(
      Error(
        `Only pull requests and pushes are supported, rebase not supported.`
      )
    )
  })

  test('add comment without title', async () => {
    const createCommentMock = jest.fn(() => Promise.resolve({}))
    const client = {
      rest: {
        issues: {
          createComment: createCommentMock
        }
      }
    } as any
    const repo = {
      owner: 'owner',
      repo: 'repo'
    }
    await addComment(12, undefined, 'body', false, client, repo)

    expect(createCommentMock).toHaveBeenCalledWith({
      issue_number: 12,
      body: 'body',
      ...repo
    })
  })

  test('add comment with title updates existing comment', async () => {
    const listCommentstMock = jest.fn(() =>
      Promise.resolve({data: [{body: '### title xyz', id: '#8'}]})
    )
    const updateCommentMock = jest.fn(() => Promise.resolve({}))
    const client = {
      rest: {
        issues: {
          listComments: listCommentstMock,
          updateComment: updateCommentMock
        }
      }
    } as any
    const repo = {
      owner: 'owner',
      repo: 'repo'
    }
    await addComment(12, 'title', 'body', true, client, repo)

    expect(listCommentstMock).toHaveBeenCalledWith({
      issue_number: 12,
      ...repo
    })
    expect(updateCommentMock).toHaveBeenCalledWith({
      comment_id: '#8',
      body: 'body',
      ...repo
    })
  })

  test('add comment with title creates new comment if no matching comment', async () => {
    const listCommentstMock = jest.fn(() =>
      Promise.resolve({data: [{body: '### header xyz', id: '#8'}]})
    )
    const createCommentMock = jest.fn(() => Promise.resolve({}))
    const client = {
      rest: {
        issues: {
          listComments: listCommentstMock,
          createComment: createCommentMock
        }
      }
    } as any
    const repo = {
      owner: 'owner',
      repo: 'repo'
    }
    await addComment(12, 'title', 'body', true, client, repo)

    expect(listCommentstMock).toHaveBeenCalledWith({
      issue_number: 12,
      ...repo
    })
    expect(createCommentMock).toHaveBeenCalledWith({
      issue_number: 12,
      body: 'body',
      ...repo
    })
  })

  test('add comment with title creates new comment', async () => {
    const createCommentMock = jest.fn(() => Promise.resolve({}))
    const client = {
      rest: {
        issues: {
          createComment: createCommentMock
        }
      }
    } as any
    const repo = {
      owner: 'owner',
      repo: 'repo'
    }
    await addComment(12, 'title', 'body', false, client, repo)

    expect(createCommentMock).toHaveBeenCalledWith({
      issue_number: 12,
      body: 'body',
      ...repo
    })
  })
})
