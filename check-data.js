const fs = require("fs")

const [TARGET_OWNER, TARGET_REPO] = process.argv.slice(2)

const data = JSON.parse(fs.readFileSync(`./data/${TARGET_OWNER}-${TARGET_REPO}_comments.json`))

const seenIds = {

}

let isDataOk = true

data.forEach(comment => {
  if(seenIds[comment.id]) {
    console.warn(`-> Found duplicate of comment #${comment.id} (occurrence #${seenIds[comment.id]})`)
    isDataOk = false
    seenIds[comment.id]++
  } else {
    seenIds[comment.id] = 1
  }
})

if(isDataOk) {
  console.log(`-> Integrity check finished, no problems detected.`)
}