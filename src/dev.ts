import {getFileCoverage, parseReport} from './reader'
import {ChangedFile} from './types.d'

const run = async (): Promise<void> => {
  const report = await parseReport('./tests/examples/report_large.xml')
  if (!report) return

  //console.log(JSON.stringify(report))
  const changedFiles: ChangedFile[] = [
    {
      filePath:
        'com/github/mi-kas/parceldeliverydetails/domain/ParcelDeliveryDetails.kt',
      url: 'url'
    },
    {
      filePath:
        'com/github/mi-kas/parceldeliverydetails/domain/ParcelDeliveryDetailsService.kt',
      url: 'url'
    }
  ]

  const filesCoverage = getFileCoverage(report, changedFiles, 'LINE')
  console.log(filesCoverage)
}

run()
