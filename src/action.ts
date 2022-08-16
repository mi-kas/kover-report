import * as actionsCore from '@actions/core'
import * as github from '@actions/github'
import {createComment} from './render'
import {parseReport, getOverallCoverage, getFileCoverage} from './reader'

export const run = async (core: typeof actionsCore): Promise<void> => {
  const path = core.getInput('path', {required: true})
  const token = core.getInput('token', {required: true})
  const title = core.getInput('title', {required: false})
  const minCoverageOverall = parseFloat(
    core.getInput('min-coverage-overall', {
      required: false
    })
  )
  // const minCoverageChangedFiles = parseFloat(
  //   core.getInput('min-coverage-changed-files', {
  //     required: false
  //   })
  // )

  const octokit = github.getOctokit(token)
  const event = github.context.eventName
  core.info(`Event is ${event}`)

  const details = getDetails(event, github.context)

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
    octokit
  )
  const filesCoverage = getFileCoverage(report, changedFiles)

  const comment = createComment(overallCoverage, minCoverageOverall)

  if (details.prNumber != null) {
    await addComment(details.prNumber, title, comment, octokit)
  }
}

const getDetails = (
  event: string,
  context: typeof github.context
): {prNumber: number | null; base: string; head: string} => {
  switch (event) {
    case 'pull_request':
    case 'pull_request_target':
      return {
        prNumber: context.payload.pull_request?.number ?? null,
        base: github.context.payload.pull_request?.base.sha,
        head: github.context.payload.pull_request?.head.sha
      }
    case 'push':
      return {
        prNumber: null,
        base: github.context.payload.before,
        head: github.context.payload.after
      }
    default:
      throw Error(
        `Only pull requests and pushes are supported, ${context.eventName} not supported.`
      )
  }
}

const addComment = async (
  prNumber: number,
  title: string,
  body: string,
  client: ReturnType<typeof github.getOctokit>
): Promise<void> => {
  let commentUpdated = false

  if (title) {
    const comments = await client.rest.issues.listComments({
      issue_number: prNumber,
      ...github.context.repo
    })
    const comment = comments.data.find(c => c.body?.startsWith(title))

    if (comment) {
      await client.rest.issues.updateComment({
        comment_id: comment.id,
        body,
        ...github.context.repo
      })
      commentUpdated = true
    }
  }

  if (!commentUpdated) {
    await client.rest.issues.createComment({
      issue_number: prNumber,
      body,
      ...github.context.repo
    })
  }
}

export type ChangedFile = {
  filePath: string
  url: string
}

const getChangedFiles = async (
  base: string,
  head: string,
  client: ReturnType<typeof github.getOctokit>
): Promise<ChangedFile[]> => {
  const response = await client.rest.repos.compareCommits({
    base,
    head,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo
  })

  return (
    response.data.files?.map(file => ({
      filePath: file.filename,
      url: file.blob_url
    })) ?? []
  )
}
