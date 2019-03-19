const fs = require("fs")

const values = require("lodash/values")
const sum = require("lodash/sum")
const map = require("lodash/map")

const [TARGET_OWNER, TARGET_REPO] = process.argv.slice(2)

const data = JSON.parse(fs.readFileSync(`./data/${TARGET_OWNER}--${TARGET_REPO}.json`))

console.log(`-> Data loaded.`)

const db = {
  troubleReported: false,
  _storage: {},
  increment(id, origin) {
    if (this._storage[id] && this._storage[id][origin]) {
      this._storage[id][origin]++
    } else if (this._storage[id]) {
      this._storage[id][origin] = 1
    } else {
      this._storage[id] = { [origin]: 1 }
    }
  },
  totalForId(id) {
    return sum(values(this._storage[id] || {}))
  },
  reportForId(id, type) {
    if(this.totalForId(id) > 1) {
      this.troubleReported = true
      const data = this._storage[id]
      const reportStr = map(data, (v, k) => `${v} ${k}`).join(", ")
      console.warn(`!! Found duplicate of ${type} #${id}. Occurred in ${reportStr}.`)
    }
  },
  duplicateCount() {
    return Object.keys(this._storage)
      .map(id => this.totalForId(id))
      .filter(total => total > 1)
      .length
  }
}

data.issues.forEach(issue => {
  db.increment(issue.id, "issues")
  db.reportForId(issue.id, "issue")
})

data.pulls.forEach(pull => {
  db.increment(pull.id, "pulls")
  db.reportForId(pull.id, "pull")
})
data.comments.forEach(comment => {
  db.increment(comment.id, "comments")
  db.reportForId(comment.id, "comment")
})
console.log(`-> There were ${data.pulls.length} pull requests, ${data.issues.length} issues, and ${data.comments.length} comments in this dataset.`)

if(!db.troubleReported) {
  console.log(`-> Integrity check finished, no problems detected.`)
} else {
  console.log(`-> Integrity check finished, ${db.duplicateCount()} duplicate IDs were found in total.`)
}