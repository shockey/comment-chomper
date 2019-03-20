const fs = require("fs")
const moment = require("moment")
const pad = require("utils-pad-string")

const sum = require("lodash/sum")
const values = require("lodash/values")
const map = require("lodash/map")


const argv = require('yargs').argv

const CUTOFF = argv.cutoff || 5
const SINCE = argv.since ? moment(argv.since) : moment().subtract(2, "years")
const UNTIL = argv.until ? moment(argv.until) :  moment()

if(UNTIL.isSameOrBefore(SINCE)) {
  console.error("-> Fatal error: `until` is before or the same as `since`. Can't compute anything!")
  process.exit(1)
}

const [TARGET_OWNER, TARGET_REPO] = process.argv.slice(2)

const repoData = JSON.parse(fs.readFileSync(`./data/${TARGET_OWNER}--${TARGET_REPO}.json`))

const reportData = {}

const increment = (author, item) => {
  if (reportData[author] && reportData[author][item]) {
    reportData[author][item]++
  } else if (reportData[author]) {
    reportData[author][item] = 1
  } else {
    reportData[author] = { [item]: 1 }
  }
}

repoData.pulls
  .filter(pull => SINCE.isBefore(pull.created_at))
  .filter(pull => UNTIL.isSameOrAfter(pull.created_at))
  .forEach(pull => increment(pull.user.login, "pulls"))

repoData.issues
  .filter(issue => SINCE.isBefore(issue.created_at))
  .filter(issue => UNTIL.isSameOrAfter(issue.created_at))
  .forEach(issue => increment(issue.user.login, "issues"))

repoData.comments
  .filter(comment => SINCE.isBefore(comment.created_at))
  .filter(comment => UNTIL.isSameOrAfter(comment.created_at))
  .forEach(comment => increment(comment.user.login, "comments"))

let tuples = []

for(author in reportData) {
  const authorData = reportData[author]
  const score = sum(values(authorData))
  tuples.push([author, score])
}

tuples.sort((a, b) => {
  return b[1] - a[1]
})

tuples = tuples.filter(([author, score]) => score >= CUTOFF)

console.log(`-- Top interactors for ${TARGET_OWNER}/${TARGET_REPO} from ${SINCE.format("M/D/YY")} to ${UNTIL.format("M/D/YY")} --`)
tuples.forEach(([user, score]) => {
  score = score.toString()
  const dataForUser = reportData[user]
  const dataString = map(dataForUser, (v, k) => `${v} ${k}`).join(", ")
  console.log(
    `${pad(user, 20)} ${pad(score, 6)} (${dataString})`
  )
})
