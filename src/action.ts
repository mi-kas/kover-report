import * as actionsCore from '@actions/core'
import * as actionsGithub from '@actions/github'
import {createComment} from './render'
import {parseReport, getOverallCoverage, getFileCoverage} from './reader'
import {ChangedFile} from './types.d'

export const run = async (
  core: typeof actionsCore,
  github: typeof actionsGithub
): Promise<void> => {
  const path = core.getInput('path', {required: true})
  const token = core.getInput('token', {required: true})
  const title = core.getInput('title', {required: false})
  const minCoverageOverallInput = core.getInput('min-coverage-overall', {
    required: false
  })
  let minCoverageOverall: number | undefined
  if (minCoverageOverallInput !== '') {
    minCoverageOverall = parseFloat(minCoverageOverallInput)
  }
  const minCoverageChangedFilesInput = core.getInput(
    'min-coverage-changed-files',
    {
      required: false
    }
  )
  let minCoverageChangedFiles: number | undefined
  if (minCoverageChangedFilesInput !== '') {
    minCoverageChangedFiles = parseFloat(minCoverageChangedFilesInput)
  }

  const octokit = github.getOctokit(token)
  const event = github.context.eventName
  core.info(`Event is ${event}`)

  const details = getDetails(event, github.context.payload)

  const report = await parseReport(path)
  if (!report) {
    throw Error('No kover report detected')
  }

  const overallCoverage = getOverallCoverage(report)
  if (!overallCoverage) {
    throw Error('No project coverage detected')
  }
  core.setOutput('coverage-overall', overallCoverage.percentage)

  const changedFiles = await getChangedFiles(
    details.base,
    details.head,
    octokit,
    github.context.repo
  )
  const filesCoverage = getFileCoverage(report, changedFiles)
  core.setOutput('coverage-changed-files', filesCoverage.percentage)

  const comment = createComment(
    overallCoverage,
    filesCoverage,
    minCoverageOverall,
    minCoverageChangedFiles
  )

  if (details.prNumber != null) {
    await addComment(
      details.prNumber,
      title,
      comment,
      octokit,
      github.context.repo
    )
  }
}

const getDetails = (
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

const addComment = async (
  prNumber: number,
  title: string,
  body: string,
  client: ReturnType<typeof actionsGithub.getOctokit>,
  repo: typeof actionsGithub.context.repo
): Promise<void> => {
  let commentUpdated = false

  if (title) {
    const comments = await client.rest.issues.listComments({
      issue_number: prNumber,
      ...repo
    })
    const comment = comments.data.find(c => c.body?.startsWith(title))

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

const getChangedFiles = async (
  base: string,
  head: string,
  client: ReturnType<typeof actionsGithub.getOctokit>,
  repo: typeof actionsGithub.context.repo
): Promise<ChangedFile[]> => {
  const response = await client.rest.repos.compareCommits({
    base,
    head,
    owner: repo.owner,
    repo: repo.repo
  })

  return (
    response.data.files?.map(file => ({
      filePath: file.filename,
      url: file.blob_url
    })) ?? []
  )
}
