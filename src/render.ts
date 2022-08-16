import {Coverage, ChangedFilesCoverage} from './types.d'

export const createComment = (
  coverage: Coverage,
  changedFilesCoverage: ChangedFilesCoverage,
  minCoverageOverall: number | undefined,
  minCoverageChangedFiles: number | undefined
): string => {
  return `${
    changedFilesCoverage.files.length > 0
      ? `|File|Coverage [${changedFilesCoverage.percentage.toFixed(2)}%]|${
          minCoverageChangedFiles
            ? renderEmoji(
                changedFilesCoverage.percentage,
                minCoverageChangedFiles
              )
            : ''
        }\n|:-|:-:|${
          minCoverageChangedFiles ? ':-:|' : ''
        }\n${changedFilesCoverage.files
          .map(
            file =>
              `|[${file.filePath}](${file.url})|${file.percentage.toFixed(
                2
              )}%|${
                minCoverageChangedFiles
                  ? renderEmoji(file.percentage, minCoverageChangedFiles)
                  : ''
              }`
          )
          .join('\n')}\n\n`
      : ''
  }|Total Project Coverage|${coverage.percentage.toFixed(2)}%|${
    minCoverageOverall
      ? renderEmoji(coverage.percentage, minCoverageOverall)
      : ''
  }\n|:-|:-:|${minCoverageOverall ? ':-:|' : ''}`
}

export const renderEmoji = (
  percentage: number,
  minPercentage: number
): string => (percentage >= minPercentage ? ':white_check_mark:|' : ':x:|')
