import {describe, expect, test, vi} from 'vitest'
import {addComment, getChangedFiles, getDetails, run} from '../src/action'

describe('Action functions', () => {
  test('run ignores modules without matching changed files', async () => {
    const compareCommitsMock = vi.fn(() =>
      Promise.resolve({
        data: {
          files: [{filename: 'pkg/Foo.kt', blob_url: 'foo-url'}]
        }
      })
    )
    const createIssueCommentMock = vi.fn(() => Promise.resolve({}))
    const setOutputMock = vi.fn()
    const core = {
      getMultilineInput: vi.fn(() => [
        './tests/examples/multi_module_a.xml',
        './tests/examples/multi_module_b.xml'
      ]),
      getInput: vi.fn((name: string) => {
        const inputs: Record<string, string> = {
          token: 'token',
          title: '',
          'update-comment': 'false',
          'min-coverage-overall': '',
          'min-coverage-changed-files': '',
          'coverage-counter-type': ''
        }
        return inputs[name] ?? ''
      }),
      info: vi.fn(),
      setOutput: setOutputMock
    } as any
    const github = {
      getOctokit: vi.fn(() => ({
        rest: {
          repos: {
            compareCommits: compareCommitsMock
          },
          issues: {
            createComment: createIssueCommentMock
          }
        }
      })),
      context: {
        eventName: 'pull_request',
        payload: {
          pull_request: {
            number: 12,
            base: {sha: 'base_sha'},
            head: {sha: 'head_sha'}
          }
        },
        repo: {
          owner: 'owner',
          repo: 'repo'
        }
      }
    } as any

    await run(core, github)

    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'coverage-overall', 28.57)
    expect(setOutputMock).toHaveBeenNthCalledWith(
      2,
      'coverage-changed-files',
      75
    )
    expect(createIssueCommentMock).toHaveBeenCalledWith({
      issue_number: 12,
      body: `|File|Coverage [75.00%]|\n|:-|:-:|\n|[pkg/Foo.kt](foo-url)|75.00%|\n\n|Total Project Coverage|28.57%|\n|:-|:-:|`,
      owner: 'owner',
      repo: 'repo'
    })
  })

  test('run resolves glob report paths', async () => {
    const compareCommitsMock = vi.fn(() =>
      Promise.resolve({
        data: {
          files: [{filename: 'pkg/Foo.kt', blob_url: 'foo-url'}]
        }
      })
    )
    const createIssueCommentMock = vi.fn(() => Promise.resolve({}))
    const setOutputMock = vi.fn()
    const core = {
      getMultilineInput: vi.fn(() => ['./tests/examples/multi_module_*.xml']),
      getInput: vi.fn((name: string) => {
        const inputs: Record<string, string> = {
          token: 'token',
          title: '',
          'update-comment': 'false',
          'min-coverage-overall': '',
          'min-coverage-changed-files': '',
          'coverage-counter-type': ''
        }
        return inputs[name] ?? ''
      }),
      info: vi.fn(),
      setOutput: setOutputMock
    } as any
    const github = {
      getOctokit: vi.fn(() => ({
        rest: {
          repos: {
            compareCommits: compareCommitsMock
          },
          issues: {
            createComment: createIssueCommentMock
          }
        }
      })),
      context: {
        eventName: 'pull_request',
        payload: {
          pull_request: {
            number: 12,
            base: {sha: 'base_sha'},
            head: {sha: 'head_sha'}
          }
        },
        repo: {
          owner: 'owner',
          repo: 'repo'
        }
      }
    } as any

    await run(core, github)

    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'coverage-overall', 28.57)
    expect(setOutputMock).toHaveBeenNthCalledWith(
      2,
      'coverage-changed-files',
      75
    )
    expect(createIssueCommentMock).toHaveBeenCalledWith({
      issue_number: 12,
      body: `|File|Coverage [75.00%]|\n|:-|:-:|\n|[pkg/Foo.kt](foo-url)|75.00%|\n\n|Total Project Coverage|28.57%|\n|:-|:-:|`,
      owner: 'owner',
      repo: 'repo'
    })
  })

  test('run calculates overall coverage from aggregated totals', async () => {
    const compareCommitsMock = vi.fn(() =>
      Promise.resolve({
        data: {
          files: [{filename: 'pkg/Foo.kt', blob_url: 'foo-url'}]
        }
      })
    )
    const createIssueCommentMock = vi.fn(() => Promise.resolve({}))
    const setOutputMock = vi.fn()
    const core = {
      getMultilineInput: vi.fn(() => [
        './tests/examples/multi_module_a.xml',
        './tests/examples/multi_module_b.xml'
      ]),
      getInput: vi.fn((name: string) => {
        const inputs: Record<string, string> = {
          token: 'token',
          title: '',
          'update-comment': 'false',
          'min-coverage-overall': '',
          'min-coverage-changed-files': '',
          'coverage-counter-type': ''
        }
        return inputs[name] ?? ''
      }),
      info: vi.fn(),
      setOutput: setOutputMock
    } as any
    const github = {
      getOctokit: vi.fn(() => ({
        rest: {
          repos: {
            compareCommits: compareCommitsMock
          },
          issues: {
            createComment: createIssueCommentMock
          }
        }
      })),
      context: {
        eventName: 'pull_request',
        payload: {
          pull_request: {
            number: 12,
            base: {sha: 'base_sha'},
            head: {sha: 'head_sha'}
          }
        },
        repo: {
          owner: 'owner',
          repo: 'repo'
        }
      }
    } as any

    await run(core, github)

    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'coverage-overall', 28.57)
    expect(createIssueCommentMock).toHaveBeenCalledWith({
      issue_number: 12,
      body: `|File|Coverage [75.00%]|\n|:-|:-:|\n|[pkg/Foo.kt](foo-url)|75.00%|\n\n|Total Project Coverage|28.57%|\n|:-|:-:|`,
      owner: 'owner',
      repo: 'repo'
    })
  })

  test('run throws when no report contains the selected overall counter', async () => {
    const compareCommitsMock = vi.fn(() =>
      Promise.resolve({
        data: {
          files: [{filename: 'pkg/Foo.kt', blob_url: 'foo-url'}]
        }
      })
    )
    const createIssueCommentMock = vi.fn(() => Promise.resolve({}))
    const setOutputMock = vi.fn()
    const core = {
      getMultilineInput: vi.fn(() => ['./tests/examples/multi_module_a.xml']),
      getInput: vi.fn((name: string) => {
        const inputs: Record<string, string> = {
          token: 'token',
          title: '',
          'update-comment': 'false',
          'min-coverage-overall': '',
          'min-coverage-changed-files': '',
          'coverage-counter-type': 'BRANCH'
        }
        return inputs[name] ?? ''
      }),
      info: vi.fn(),
      setOutput: setOutputMock
    } as any
    const github = {
      getOctokit: vi.fn(() => ({
        rest: {
          repos: {
            compareCommits: compareCommitsMock
          },
          issues: {
            createComment: createIssueCommentMock
          }
        }
      })),
      context: {
        eventName: 'pull_request',
        payload: {
          pull_request: {
            number: 12,
            base: {sha: 'base_sha'},
            head: {sha: 'head_sha'}
          }
        },
        repo: {
          owner: 'owner',
          repo: 'repo'
        }
      }
    } as any

    await expect(run(core, github)).rejects.toThrowError(
      Error('No project coverage detected')
    )
    expect(setOutputMock).not.toHaveBeenCalled()
    expect(createIssueCommentMock).not.toHaveBeenCalled()
  })

  test('get changed files from context', async () => {
    const compareCommitsMock = vi.fn(() =>
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
    const compareCommitsMock = vi.fn(() =>
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
    const createCommentMock = vi.fn(() => Promise.resolve({}))
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
    const listCommentstMock = vi.fn(() =>
      Promise.resolve({data: [{body: '### title xyz', id: '#8'}]})
    )
    const updateCommentMock = vi.fn(() => Promise.resolve({}))
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
    const listCommentstMock = vi.fn(() =>
      Promise.resolve({data: [{body: '### header xyz', id: '#8'}]})
    )
    const createCommentMock = vi.fn(() => Promise.resolve({}))
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
    const createCommentMock = vi.fn(() => Promise.resolve({}))
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
