import * as core from '@actions/core'
import * as github from '@actions/github'
import {run} from './action'

try {
  run(core, github)
} catch (error: unknown) {
  core.setFailed((error as Error).message)
}
