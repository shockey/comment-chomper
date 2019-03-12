require('dotenv').config()

const fs = require("fs")
const axios = require("axios")
var parseLinkHeader = require('parse-link-header')

const [TARGET_OWNER, TARGET_REPO] = process.argv.slice(2)

let comments = []

async function fetchGithubPage(url) {
  console.log(`- - - - - - -`)
  console.log(`-> Fetching ${url.replace(/access_token=\w+&/, "")}`)

  try {
    var res = await axios({
      url: url,
      params: {
        access_token: process.env.GITHUB_TOKEN,
        since: encodeURIComponent("2018-01-01T00:00:00Z") // YYYY-MM-DDTHH:MM:SSZ
      },
      headers: {
        Accept: "application/vnd.github.v3+json"
      }
    })
  } catch(e) {
    const resCode = e.response.status

    console.log(`-> Error from GitHub: ${JSON.stringify(e.response.data)}`)

    if(resCode === 401) {
      console.log(`-> Have you added your GITHUB_TOKEN to .env?`)
    }

    process.exit(0)
  }
  
  comments = comments.concat(res.data)

  return res
}

async function paginationLoop(url) {
  const res = await fetchGithubPage(url)
  console.log(`-> Request done, ${comments.length} comments now stored in memory`)
  const linkInfo = parseLinkHeader(res.headers.link)

  if(linkInfo.next) {
    return paginationLoop(linkInfo.next.url)
  } else {
    return comments
  }
}

async function main() {
  const res = await paginationLoop(`https://api.github.com/repos/${TARGET_OWNER}/${TARGET_REPO}/issues/comments`)
  const targetFilename = `./data/${TARGET_OWNER}-${TARGET_REPO}_comments.json`
  console.log(`\n-> Download finished, writing data to ${targetFilename}`)
  fs.writeFileSync(targetFilename, JSON.stringify(res, null, 2))
}

main()