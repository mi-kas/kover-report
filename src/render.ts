import {Coverage} from './reader'

export const createComment = (
  coverage: Coverage,
  minCoverageOverall: number
): string => {
  return `
  |Total Project Coverage|${coverage.percentage}%|${
    coverage.percentage >= minCoverageOverall ? ':white_check_mark:' : ':x:'
  }|
  |:-|:-:|:-:|
  `
}
