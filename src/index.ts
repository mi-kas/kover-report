import * as core from '@actions/core'
import {run} from './action'

try {
  run(core)
} catch (error: unknown) {
  core.setFailed((error as Error).message)
}
