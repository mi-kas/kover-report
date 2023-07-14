import * as actionsCore from '@actions/core'
import * as actionsGithub from '@actions/github'
import {createComment} from './render'
import {getFileCoverage, getOverallCoverage, parseReport} from './reader'
import {
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
      ? parseFloat(minCoverageOverallInput)
      : undefined
  const minCoverageChangedFilesInput = core.getInput(
    'min-coverage-changed-files',
    {
      required: false
    }
  )
  const minCoverageChangedFiles =
    minCoverageChangedFilesInput !== ''
      ? parseFloat(minCoverageChangedFilesInput)
      : undefined
  const counterTypeInput = core.getInput('coverage-counter-type', {
    required: false
  })
  const counterType = (
    counterTypeInput !== '' ? counterTypeInput : 'LINE'
  ) as CounterType

  const octokit = github.getOctokit(token)
  const event = github.context.eventName
  core.info(`Event is ${event}`)

  if (paths.length === 0) {
    throw Error('At least one path must be provided')
  }

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

  const totalReports = paths.length
  for (const path of paths) {
    const report = await parseReport(path)
    if (!report) {
      throw Error(`No Kover report detected in path ${path}`)
    }

    const reportsCoverage = getOverallCoverage(report, counterType)
    overallCoverage.missed += reportsCoverage?.missed ?? 0
    overallCoverage.covered += reportsCoverage?.covered ?? 0
    overallCoverage.percentage += reportsCoverage?.percentage ?? 0

    const reportsFilesCovered = getFileCoverage(
      report,
      changedFiles,
      counterType
    )
    overallFilesCoverage.percentage += reportsFilesCovered.percentage
    overallFilesCoverage.files = overallFilesCoverage.files.concat(
      reportsFilesCovered.files
    )
  }

  overallCoverage.percentage = overallCoverage.percentage / totalReports
  overallFilesCoverage.percentage =
    overallFilesCoverage.percentage / totalReports

  if (!overallCoverage) {
    throw Error('No project coverage detected')
  }
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
