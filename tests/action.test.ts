import {afterEach, describe, expect, test, vi} from 'vitest'
import {
  addComment,
  getChangedFiles,
  getDetails,
  getUploadMetadata,
  run,
  uploadReports
} from '../src/action'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

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

  test('run uses line coverage by default for issue 322 fixture', async () => {
    const compareCommitsMock = vi.fn(() =>
      Promise.resolve({
        data: {
          files: []
        }
      })
    )
    const createIssueCommentMock = vi.fn(() => Promise.resolve({}))
    const setOutputMock = vi.fn()
    const core = {
      getMultilineInput: vi.fn(() => ['./tests/examples/issue_322_report.xml']),
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
            number: 322,
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

    expect(setOutputMock).toHaveBeenNthCalledWith(1, 'coverage-overall', 99.44)
    expect(setOutputMock).toHaveBeenNthCalledWith(
      2,
      'coverage-changed-files',
      0
    )
    expect(createIssueCommentMock).toHaveBeenCalledWith({
      issue_number: 322,
      body: `|Total Project Coverage|99.44%|\n|:-|:-:|`,
      owner: 'owner',
      repo: 'repo'
    })
  })

  test('run uploads resolved reports when upload inputs are set', async () => {
    const compareCommitsMock = vi.fn(() =>
      Promise.resolve({
        data: {
          files: []
        }
      })
    )
    const getCommitMock = vi.fn(() =>
      Promise.resolve({
        data: {
          commit: {
            author: {
              date: '2026-04-29T10:11:12Z'
            },
            message: 'PR head subject\n\nLonger body'
          }
        }
      })
    )
    const createIssueCommentMock = vi.fn(() => Promise.resolve({}))
    const setOutputMock = vi.fn()
    const infoMock = vi.fn()
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK'
      })
    )

    vi.stubGlobal('fetch', fetchMock)
    const core = {
      getMultilineInput: vi.fn(() => ['./tests/examples/report.xml']),
      getInput: vi.fn((name: string) => {
        const inputs: Record<string, string> = {
          token: 'token',
          title: '',
          'update-comment': 'false',
          'min-coverage-overall': '',
          'min-coverage-changed-files': '',
          'coverage-counter-type': '',
          upload_url: 'https://coverage.example.com/base/path',
          upload_token: 'upload-token'
        }
        return inputs[name] ?? ''
      }),
      info: infoMock,
      setOutput: setOutputMock
    } as any
    const github = {
      getOctokit: vi.fn(() => ({
        rest: {
          repos: {
            compareCommits: compareCommitsMock,
            getCommit: getCommitMock
          },
          issues: {
            createComment: createIssueCommentMock
          }
        }
      })),
      context: {
        eventName: 'pull_request',
        actor: 'octocat',
        ref_name: '12/merge',
        sha: 'merge_sha',
        payload: {
          pull_request: {
            number: 12,
            base: {sha: 'base_sha'},
            head: {
              sha: 'head_sha',
              ref: 'feature/upload',
              repo: {
                owner: {
                  login: 'contributor'
                },
                name: 'forked-repo'
              }
            }
          }
        },
        repo: {
          owner: 'mi-kas',
          repo: 'kover-report'
        }
      }
    } as any

    await run(core, github)

    expect(getCommitMock).toHaveBeenCalledWith({
      owner: 'contributor',
      repo: 'forked-repo',
      ref: 'head_sha'
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, request] = fetchMock.mock.calls[0]
    expect(url).toBeInstanceOf(URL)
    expect((url as URL).toString()).toBe(
      'https://coverage.example.com/base/path'
    )
    expect(request.method).toBe('POST')
    expect(request.headers).toEqual({
      Authorization: 'Bearer upload-token'
    })
    expect(request.body).toBeInstanceOf(FormData)
    const formData = request.body as FormData
    expect(formData.get('repoSlug')).toBe('mi-kas/kover-report')
    expect(formData.get('branch')).toBe('feature/upload')
    expect(formData.get('commitSha')).toBe('head_sha')
    expect(formData.get('commitTimestamp')).toBe('2026-04-29T10:11:12Z')
    expect(formData.get('commitUser')).toBe('octocat')
    expect(formData.get('commitMessage')).toBe('PR head subject')
    const uploadedFile = formData.get('file')
    expect(uploadedFile).toBeInstanceOf(File)
    expect((uploadedFile as File).name).toBe('report.xml')
  })

  test('upload reports requires both upload inputs', async () => {
    await expect(
      uploadReports(
        ['./tests/examples/report.xml'],
        'https://coverage.example.com',
        undefined,
        {info: vi.fn()} as any,
        {context: {actor: 'octocat'}} as any,
        {} as any
      )
    ).rejects.toThrowError(
      Error('Both upload_url and upload_token must be set together')
    )
  })

  test('get upload metadata uses github actor as commit user', async () => {
    const metadata = await getUploadMetadata(
      {
        actor: 'octocat',
        ref_name: 'main',
        sha: 'abc123',
        payload: {},
        repo: {
          owner: 'mi-kas',
          repo: 'kover-report'
        }
      } as any,
      {} as any
    )

    expect(metadata.commitUser).toBe('octocat')
  })

  test('get upload metadata derives repo, branch and sha from pull request context', async () => {
    const getCommitMock = vi.fn(() =>
      Promise.resolve({
        data: {
          commit: {
            author: {
              date: '2026-04-29T12:00:00Z'
            },
            message: 'PR head subject\n\nBody'
          }
        }
      })
    )
    const metadata = await getUploadMetadata(
      {
        actor: 'octocat',
        ref_name: '12/merge',
        sha: 'merge_sha',
        payload: {
          pull_request: {
            head: {
              sha: 'head_sha',
              ref: 'feature/upload',
              repo: {
                owner: {
                  login: 'contributor'
                },
                name: 'forked-repo'
              }
            }
          }
        },
        repo: {
          owner: 'mi-kas',
          repo: 'kover-report'
        }
      } as any,
      {
        rest: {
          repos: {
            getCommit: getCommitMock
          }
        }
      } as any
    )

    expect(metadata.repoSlug).toBe('mi-kas/kover-report')
    expect(metadata.branch).toBe('feature/upload')
    expect(metadata.commitSha).toBe('head_sha')
    expect(metadata.commitTimestamp).toBe('2026-04-29T12:00:00Z')
    expect(metadata.commitMessage).toBe('PR head subject')
    expect(getCommitMock).toHaveBeenCalledWith({
      owner: 'contributor',
      repo: 'forked-repo',
      ref: 'head_sha'
    })
  })

  test('get upload metadata falls back to local git data when PR commit lookup fails', async () => {
    const metadata = await getUploadMetadata(
      {
        actor: 'octocat',
        ref_name: '12/merge',
        sha: 'merge_sha',
        payload: {
          pull_request: {
            head: {
              sha: 'head_sha',
              ref: 'feature/upload',
              repo: {
                owner: {
                  login: 'contributor'
                },
                name: 'forked-repo'
              }
            }
          }
        },
        repo: {
          owner: 'mi-kas',
          repo: 'kover-report'
        }
      } as any,
      {
        rest: {
          repos: {
            getCommit: vi.fn(() => Promise.reject(new Error('boom')))
          }
        }
      } as any
    )

    expect(metadata.commitSha).toBe('head_sha')
    expect(metadata.commitTimestamp).toEqual(expect.any(String))
    expect(metadata.commitTimestamp).not.toBe('')
    expect(metadata.commitMessage).toEqual(expect.any(String))
    expect(metadata.commitMessage).not.toBe('')
  })

  test('get upload metadata derives branch from push ref when no pull request exists', async () => {
    const metadata = await getUploadMetadata(
      {
        actor: 'octocat',
        ref_name: 'main',
        sha: 'def456',
        payload: {},
        repo: {
          owner: 'mi-kas',
          repo: 'kover-report'
        }
      } as any,
      {} as any
    )

    expect(metadata.repoSlug).toBe('mi-kas/kover-report')
    expect(metadata.branch).toBe('main')
    expect(metadata.commitSha).toBe('def456')
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
