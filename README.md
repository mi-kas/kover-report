# kover-report

[![Tests](https://github.com/mi-kas/kover-report/actions/workflows/test.yml/badge.svg)](https://github.com/mi-kas/kover-report/actions/workflows/test.yml)

A Github action that publishes the [Kover](https://github.com/Kotlin/kotlinx-kover) code coverage report as a comment in pull requests.

## Usage

### Pre-requisites

Create a workflow `.yml` file in your repositories `.github/workflows` directory. An [example workflow](#example-workflow) is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Inputs

- `path` - [**required**] Path to the generated kover report xml file
- `token` - [**required**] Github personal token to add commits to the pull request
- `title` - [*optional*] Title for the pull request comment
- `update-comment` - [*optional* (default: `false`)] Update the coverage report comment instead of creating a new one. Requires `title` to be set.
- `min-coverage-overall` - [*optional*] The minimum code coverage that is required to pass for overall project
- `min-coverage-changed-files` - [*optional*] The minimum code coverage that is required to pass for changed files

### Outputs

- `coverage-overall` - The overall coverage of the project
- `coverage-changed-files` - The total coverage of all changed files

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
        uses: mi-kas/kover-report@v0.1
        with:
          paths: ${{ github.workspace }}/build/reports/kover/report.xml
          token: ${{ secrets.GITHUB_TOKEN }}
          title: Code Coverage
          update-comment: true
          min-coverage-overall: 80
          min-coverage-changed-files: 80
```

<br>
<img src="/screenshot.png" alt="output screenshot" title="output screenshot" width="500" />

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
