# kover-report

[![Tests](https://github.com/mi-kas/kover-report/actions/workflows/test.yml/badge.svg)](https://github.com/mi-kas/kover-report/actions/workflows/test.yml) [![GitHub License](https://img.shields.io/github/license/mi-kas/kover-report?label=License)](https://github.com/mi-kas/kover-report/blob/main/LICENSE) [![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)

A Github action that publishes the [Kover](https://github.com/Kotlin/kotlinx-kover) code coverage report as a comment in pull requests.

## Usage

### Pre-requisites

Create a workflow `.yml` file in your repositories `.github/workflows` directory. An [example workflow](#example-workflow) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Inputs

- `path` - [**required** string[]] List of paths to the generated kover report xml files
- `token` - [**required** string] Github personal token to add commits to the pull request
- `title` - [*optional* string] Title for the pull request comment
- `update-comment` - [*optional* boolean (default: `false`)] Update the coverage report comment instead of creating a new one. Requires `title` to be set.
- `min-coverage-overall` - [*optional* integer] The minimum code coverage that is required to pass for overall project
- `min-coverage-changed-files` - [*optional* integer] The minimum code coverage that is required to pass for changed files
- `coverage-counter-type` - [*optional* string (default: `LINE`)] Report counter type used to calculate coverage metrics. Possible values are: `INSTRUCTION`, `LINE` or `BRANCH`.

### Outputs

- `coverage-overall` - [integer] The overall coverage of the project
- `coverage-changed-files` - [integer] The total coverage of all changed files

### Example Workflow

```yaml
name: Measure coverage

on:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: 11
      - name: Set up Gradle
        uses: gradle/gradle-build-action@v2
      - name: Generate kover coverage report
        run: ./gradlew koverXmlReport

      - name: Add coverage report to PR
        id: kover
        uses: mi-kas/kover-report@v1
        with:
          path: |
            ${{ github.workspace }}/project1/build/reports/kover/report.xml
            ${{ github.workspace }}/project2/build/reports/kover/report.xml
          token: ${{ secrets.GITHUB_TOKEN }}
          title: Code Coverage
          update-comment: true
          min-coverage-overall: 80
          min-coverage-changed-files: 80
          coverage-counter-type: LINE
```

<br>
<img src="/screenshot.png" alt="output screenshot" title="output screenshot" width="500" />

## Limitations

GitHub restricts the maximum permissions to read-only for personal access tokens for pull requests originating from a public forked repository (read more [here](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)). This prevents the default configuration of this action from successfully posting the report as a PR comment when using it on public repositories with limited permissions for users to create branches and therefore requiring them to create pull requests from forks.

## Code of Conduct

Please read the [full Code of Conduct](CODE_OF_CONDUCT.md) so that you can understand what we expect project participants to adhere to and what actions will and will not be tolerated.

## Thanks

Besides all the [great open source software](package.json) that is powering `kover-report`, special thanks also to JetBrains for making a [open source development license](https://www.jetbrains.com/community/opensource) available.

<img src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.png" alt="JetBrains logo" width="100" height="100">

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
