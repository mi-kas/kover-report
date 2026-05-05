import * as core from '@actions/core'
import * as github from '@actions/github'
import {run} from './action'

void run(core, github).catch((error: unknown) => {
  core.setFailed((error as Error).message)
})
