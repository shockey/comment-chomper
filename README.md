# `comment-chomper`

### Setup

1. run `npm install`
2. set `GITHUB_TOKEN` in `.env` (get a token [here](https://github.com/settings/tokens))

### Usage

1. download a repository's comments: `node fetch-data [repo_owner] [repo_name]`
2. confirm data integrity: `node check-data [repo_owner] [repo_name]`
3. generate a report: `node report-top-interactors [repo_owner] [repo_name] --since [timestamp] --until [timestamp] --cutoff [minimum_score]`

Reports, by default, only consider issues/PRs/comments created within the last two years. This can be overridden with the `--since` option.

CLI timestamps aren't very picky, for example `YYYY-MM-DD` format is fine.

### Limitations

- Data fetches are not tuned to respect GitHub's API request limits, and may fail on very active repos
- Commits are not included in datasets, which may result in underrepresentation of core contributors in repositories that don't follow a PR-only repository model.

### License

This tool was developed for SmartBear Software. No public license is provided for this tool.
