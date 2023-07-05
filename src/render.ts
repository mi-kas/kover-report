import {ChangedFilesCoverage, Coverage} from './types.d'

export const createComment = (
  title: string | undefined,
  coverage: Coverage,
  changedFilesCoverage: ChangedFilesCoverage,
  minCoverageOverall: number | undefined,
  minCoverageChangedFiles: number | undefined
): string => {
  // Build title markdown
  const titleMarkdown = title ? `### ${title}\n` : ''

  // Build changed files markdown
  let changedFilesMarkdown = ''
  if (changedFilesCoverage.files.length > 0) {
    const filesTableRows = changedFilesCoverage.files
      .map(file => {
        const emoji = minCoverageChangedFiles
          ? renderEmoji(file.percentage, minCoverageChangedFiles)
          : ''
        const fileName = file.filePath.split('/').pop()
        return `|[${fileName}](${file.url})|${file.percentage.toFixed(
          2
        )}%|${emoji}`
      })
      .join('\n')

    const emojiHeader = minCoverageChangedFiles ? ':-:|' : ''
    const filesTableHeader = `|File|Coverage [${changedFilesCoverage.percentage.toFixed(
      2
    )}%]|${emojiHeader}\n`
    const filesTableSubHeader = `|:-|:-:|${emojiHeader}\n`

    changedFilesMarkdown = `${filesTableHeader}${filesTableSubHeader}${filesTableRows}\n\n`
  }

  // Build total coverage markdown
  const totalEmoji = minCoverageOverall
    ? renderEmoji(coverage.percentage, minCoverageOverall)
    : ''
  const totalEmojiHeader = minCoverageOverall ? ':-:|' : ''
  const totalCoverageMarkdown = `|Total Project Coverage|${coverage.percentage.toFixed(
    2
  )}%|${totalEmoji}\n|:-|:-:|${totalEmojiHeader}`

  // Return combined markdown
  return `${titleMarkdown}${changedFilesMarkdown}${totalCoverageMarkdown}`
}

export const renderEmoji = (
  percentage: number,
  minPercentage: number
): string => (percentage >= minPercentage ? ':white_check_mark:|' : ':hankey:|')
