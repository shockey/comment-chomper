const fs = require("fs")
const pad = require("utils-pad-string")

const [TARGET_OWNER, TARGET_REPO, CUTOFF = 5] = process.argv.slice(2)

const comments = JSON.parse(fs.readFileSync(`./data/${TARGET_OWNER}-${TARGET_REPO}_comments.json`))

const authors = {}

comments.forEach(c => {
  const author = c.user.login

  if(authors[author]) {
    authors[author]++
  } else {
    authors[author] = 1
  }
})

let tuples = []

for(author in authors) {
  tuples.push([author, authors[author]])
}

tuples.sort((a, b) => {
  return b[1] - a[1]
})

tuples = tuples.filter(t => t[1] >= CUTOFF)

console.log(`-- Frequent Commenters for ${TARGET_OWNER}/${TARGET_REPO} --`)
tuples.forEach(arr => console.log(`${pad(arr[0], 20)} ${arr[1]}`))
