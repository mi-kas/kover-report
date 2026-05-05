import {run} from './action'

const importModule = new Function('specifier', 'return import(specifier)') as <
  T
>(
  specifier: string
) => Promise<T>

async function main() {
  const core =
    await importModule<typeof import('@actions/core')>('@actions/core')
  const github =
    await importModule<typeof import('@actions/github')>('@actions/github')

  try {
    await run(core, github)
  } catch (error: unknown) {
    core.setFailed((error as Error).message)
  }
}

void main()
