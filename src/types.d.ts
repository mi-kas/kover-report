export type Counter = {
  $: {
    type: 'INSTRUCTION' | 'BRANCH' | 'LINE' | 'METHOD' | 'CLASS'
    missed: string
    covered: string
  }
}

type Class = {
  $: {
    name: string
    sourcefilename: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  method: any[]
  counter: Counter[]
}

type SourceFile = {
  $: {
    name: string
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  line: any[]
  counter: Counter[]
}

type Package = {
  $: {
    name: string
  }
  class: Class[]
  sourcefile: SourceFile[]
  counter: Counter[]
}

export type Report = {
  report: {
    $: {
      name: string
    }
    package?: Package[]
    counter?: Counter[]
  }
}

export type Coverage = {
  missed: number
  covered: number
  percentage: number
}

export type ChangedFileWithCoverage = Coverage & ChangedFile

export type ChangedFilesCoverage = {
  percentage: number
  files: ChangedFileWithCoverage[]
}

export type ChangedFile = {
  filePath: string
  url: string
}
