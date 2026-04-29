import {execFileSync} from 'node:child_process'
import {readFile} from 'node:fs/promises'
import {basename} from 'node:path'
import type * as actionsCore from '@actions/core'
import type * as actionsGithub from '@actions/github'
import {
  getFileCoverage,
  getOverallCoverage,
  getPercentage,
  getTotalPercentage,
  parseReport,
  resolveReportPaths
} from './reader'
import {createComment} from './render'
import type {
  ChangedFile,
  ChangedFilesCoverage,
  CounterType,
  Coverage
} from './types.d'

export const run = async (
  core: typeof actionsCore,
  github: typeof actionsGithub
): Promise<void> => {
  const paths: string[] = core.getMultilineInput('path', {required: true})
  const token = core.getInput('token', {required: true})
  const titleInput = core.getInput('title', {required: false})
  const title = titleInput !== '' ? titleInput : undefined
  const updateComment =
    core.getInput('update-comment', {required: false}) === 'true'
  const minCoverageOverallInput = core.getInput('min-coverage-overall', {
    required: false
  })
  const minCoverageOverall =
    minCoverageOverallInput !== ''
      ? Number.parseFloat(minCoverageOverallInput)
      : undefined
  const minCoverageChangedFilesInput = core.getInput(
    'min-coverage-changed-files',
    {
      required: false
    }
  )
  const minCoverageChangedFiles =
    minCoverageChangedFilesInput !== ''
      ? Number.parseFloat(minCoverageChangedFilesInput)
      : undefined
  const counterTypeInput = core.getInput('coverage-counter-type', {
    required: false
  })
  const counterType = (
    counterTypeInput !== '' ? counterTypeInput : 'LINE'
  ) as CounterType
  const uploadUrlInput = core.getInput('upload_url', {required: false})
  const uploadTokenInput = core.getInput('upload_token', {required: false})
  const uploadUrl = uploadUrlInput !== '' ? uploadUrlInput : undefined
  const uploadToken = uploadTokenInput !== '' ? uploadTokenInput : undefined

  const octokit = github.getOctokit(token)
  const event = github.context.eventName
  core.info(`Event is ${event}`)

  if (paths.length === 0) {
    throw Error('At least one path must be provided')
  }

  const reportPaths = resolveReportPaths(paths)

  await uploadReports(
    reportPaths,
    uploadUrl,
    uploadToken,
    core,
    github,
    octokit
  )

  const details = getDetails(event, github.context.payload)

  const changedFiles = await getChangedFiles(
    details.base,
    details.head,
    octokit,
    github.context.repo
  )

  const overallCoverage: Coverage = {
    missed: 0,
    covered: 0,
    percentage: 0
  }
  const overallFilesCoverage: ChangedFilesCoverage = {
    percentage: 0,
    files: []
  }
  let hasOverallCoverage = false

  for (const path of reportPaths) {
    const report = await parseReport(path)
    if (!report) {
      throw Error(`No Kover report detected in path ${path}`)
    }

    const reportsCoverage = getOverallCoverage(report, counterType)
    if (reportsCoverage) {
      hasOverallCoverage = true
    }
    overallCoverage.missed += reportsCoverage?.missed ?? 0
    overallCoverage.covered += reportsCoverage?.covered ?? 0

    const reportsFilesCovered = getFileCoverage(
      report,
      changedFiles,
      counterType
    )
    overallFilesCoverage.files = overallFilesCoverage.files.concat(
      reportsFilesCovered.files
    )
  }

  if (!hasOverallCoverage) {
    throw Error('No project coverage detected')
  }
  overallCoverage.percentage = getPercentage(
    overallCoverage.covered,
    overallCoverage.missed
  )
  overallFilesCoverage.percentage =
    getTotalPercentage(overallFilesCoverage.files) ?? 0

  core.setOutput('coverage-overall', overallCoverage.percentage)
  core.setOutput('coverage-changed-files', overallFilesCoverage.percentage)

  const comment = createComment(
    title,
    overallCoverage,
    overallFilesCoverage,
    minCoverageOverall,
    minCoverageChangedFiles
  )

  if (details.prNumber != null) {
    await addComment(
      details.prNumber,
      title,
      comment,
      updateComment,
      octokit,
      github.context.repo
    )
  }
}

export const uploadReports = async (
  reportPaths: string[],
  uploadUrl: string | undefined,
  uploadToken: string | undefined,
  core: typeof actionsCore,
  github: typeof actionsGithub,
  client: ReturnType<typeof actionsGithub.getOctokit>
): Promise<void> => {
  if (uploadUrl == null && uploadToken == null) {
    return
  }

  if (uploadUrl == null || uploadToken == null) {
    throw Error('Both upload_url and upload_token must be set together')
  }

  const uploadEndpoint = new URL(uploadUrl)
  const metadata = await getUploadMetadata(github.context, client)

  for (const reportPath of reportPaths) {
    const reportContent = await readFile(reportPath)
    const formData = new FormData()
    formData.set('repoSlug', metadata.repoSlug)
    formData.set('branch', metadata.branch)
    formData.set('commitSha', metadata.commitSha)
    formData.set('commitTimestamp', metadata.commitTimestamp)
    formData.set('commitUser', metadata.commitUser)
    formData.set('commitMessage', metadata.commitMessage)
    formData.set(
      'file',
      new File([reportContent], basename(reportPath), {type: 'application/xml'})
    )

    core.info(
      `Uploading report ${reportPath} to ${uploadUrl} with metadata: ${JSON.stringify(metadata)}`
    )

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${uploadToken}`
      },
      body: formData
    })

    if (!response.ok) {
      throw Error(
        `Upload failed for ${reportPath}: ${response.status} ${response.statusText} - ${await response.text()}`
      )
    }
  }
}

export const getUploadMetadata = (
  context: typeof actionsGithub.context & {
    ref_name?: string
    head_ref?: string
  },
  client: ReturnType<typeof actionsGithub.getOctokit>
): Promise<{
  repoSlug: string
  branch: string
  commitSha: string
  commitTimestamp: string
  commitUser: string
  commitMessage: string
}> => {
  const pullRequest = context.payload.pull_request
  const defaultMetadata = {
    repoSlug: `${context.repo.owner}/${context.repo.repo}`,
    branch: context.head_ref || context.ref_name || '',
    commitSha: context.sha,
    commitTimestamp: getGitOutput('%cI'),
    commitUser: context.actor,
    commitMessage: getGitOutput('%s')
  }

  if (pullRequest == null) {
    return Promise.resolve(defaultMetadata)
  }

  const headOwner = pullRequest.head.repo?.owner?.login
  const headRepo = pullRequest.head.repo?.name
  const headSha = pullRequest.head.sha

  if (headOwner == null || headRepo == null || headSha == null) {
    return Promise.resolve({
      ...defaultMetadata,
      commitSha: headSha ?? defaultMetadata.commitSha
    })
  }

  return client.rest.repos
    .getCommit({
      owner: headOwner,
      repo: headRepo,
      ref: headSha
    })
    .then(response => ({
      ...defaultMetadata,
      commitSha: headSha,
      commitTimestamp:
        response.data.commit.author?.date ??
        response.data.commit.committer?.date ??
        defaultMetadata.commitTimestamp,
      commitMessage:
        response.data.commit.message.split('\n')[0] ||
        defaultMetadata.commitMessage
    }))
    .catch(() => ({
      ...defaultMetadata,
      commitSha: headSha
    }))
}

export const getGitOutput = (format: string): string =>
  execFileSync('git', ['show', '-s', `--format=${format}`, 'HEAD'], {
    encoding: 'utf8'
  }).trim()

export const getDetails = (
  event: string,
  payload: typeof actionsGithub.context.payload
): {prNumber: number | null; base: string; head: string} => {
  switch (event) {
    case 'pull_request':
    case 'pull_request_target':
      return {
        prNumber: payload.pull_request?.number ?? null,
        base: payload.pull_request?.base.sha,
        head: payload.pull_request?.head.sha
      }
    case 'push':
      return {
        prNumber: null,
        base: payload.before,
        head: payload.after
      }
    default:
      throw Error(
        `Only pull requests and pushes are supported, ${event} not supported.`
      )
  }
}

export const addComment = async (
  prNumber: number,
  title: string | undefined,
  body: string,
  updateComment: boolean,
  client: ReturnType<typeof actionsGithub.getOctokit>,
  repo: typeof actionsGithub.context.repo
): Promise<void> => {
  let commentUpdated = false

  if (title && updateComment) {
    const comments = await client.rest.issues.listComments({
      issue_number: prNumber,
      ...repo
    })
    const comment = comments.data.find(
      c => c.body?.startsWith(`### ${title}`) ?? false
    )

    if (comment) {
      await client.rest.issues.updateComment({
        comment_id: comment.id,
        body,
        ...repo
      })
      commentUpdated = true
    }
  }

  if (!commentUpdated) {
    await client.rest.issues.createComment({
      issue_number: prNumber,
      body,
      ...repo
    })
  }
}

export const getChangedFiles = async (
  base: string,
  head: string,
  client: ReturnType<typeof actionsGithub.getOctokit>,
  repo: typeof actionsGithub.context.repo
): Promise<ChangedFile[]> => {
  const response = await client.rest.repos.compareCommits({
    base,
    head,
    ...repo
  })

  return (
    response.data.files?.map(file => ({
      filePath: file.filename,
      url: file.blob_url
    })) ?? []
  )
}
