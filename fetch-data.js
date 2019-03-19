require('dotenv').config()

const fs = require("fs")
const axios = require("axios")
var parseLinkHeader = require('parse-link-header')

const [TARGET_OWNER, TARGET_REPO] = process.argv.slice(2)

async function fetchGithubPage(url) {
  console.log("")
  console.log(`--> Fetching ${url.replace(/access_token=\w+&/, "")}`)

  try {
    var res = await axios({
      url: url,
      params: {
        per_page: "100",
        state: "all",
        access_token: process.env.GITHUB_TOKEN
      },
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Comment-Chomper by @shockey"
      }
    })
  } catch(e) {
    const resCode = e.response.status

    console.log(`--> Error from GitHub: ${JSON.stringify(e.response.data)}`)

    if(resCode === 401) {
      console.log(`--> Have you added your GITHUB_TOKEN to .env?`)
    }

    process.exit(0)
  }

  return res
}

async function paginationLoop(url, data = []) {
  const res = await fetchGithubPage(url)
  data.push(...res.data)
  console.log(`--> Request done, ${data.length} items now stored in memory.`)
  const linkInfo = parseLinkHeader(res.headers.link)

  if(linkInfo && linkInfo.last && linkInfo.next) {
    const lastPage = parseInt(linkInfo.last.page)
    const nextPage = parseInt(linkInfo.next.page)
    console.log(`--> Expecting ${lastPage - nextPage + 1} more pages in this pagination chain.`)
  }

  if (res.headers && res.headers["x-ratelimit-remaining"]) {
    const requestsRemaining = res.headers["x-ratelimit-remaining"]
    const requestsLimit = res.headers["x-ratelimit-limit"]
    console.log(`--> GitHub will allow you ${requestsRemaining} more requests this hour, your account's limit is ${requestsLimit}.`)
  }

  if(linkInfo && linkInfo.next) {
    return paginationLoop(linkInfo.next.url, data)
  } else {
    console.log(`-> No more pagination to do. ${data.length} total items fetched.`)
    return data
  }
}

async function main() {
  const issuesAndPulls = await paginationLoop(`https://api.github.com/repos/${TARGET_OWNER}/${TARGET_REPO}/issues`)
  const comments = await paginationLoop(`https://api.github.com/repos/${TARGET_OWNER}/${TARGET_REPO}/issues/comments`)

  const issues = issuesAndPulls.filter(i => !i["pull_request"])
  const pulls = issuesAndPulls.filter(i => i["pull_request"])

  const targetFilename = `./data/${TARGET_OWNER}--${TARGET_REPO}.json`

  console.log(`\n-> Download finished, writing data to ${targetFilename}`)

  fs.writeFileSync(targetFilename, JSON.stringify({
    meta: {
      version: "2",
      generatedAt: new Date().toISOString()
    },
    pulls: pulls || [],
    issues: issues || [], 
    comments: comments || [],
  }, null, 2))
}

main()