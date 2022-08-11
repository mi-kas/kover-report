import * as actionsCore from '@actions/core'
import * as github from '@actions/github'
import {createComment} from './render'
import {getReportCoverage} from './reader'

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

  const prNumber = getPrNumber(event, github.context)

  const coverage = await getReportCoverage(path)
  if (!coverage) {
    throw Error('No project coverage detected')
  }
  const comment = createComment(coverage, minCoverageOverall)

  core.setOutput('coverage-overall', coverage.percentage)

  if (prNumber != null) {
    await addComment(prNumber, title, comment, octokit)
  }
}

const getPrNumber = (
  event: string,
  context: typeof github.context
): number | null => {
  switch (event) {
    case 'pull_request':
    case 'pull_request_target':
      return context.payload.pull_request?.number ?? null
    case 'push':
      return null
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
