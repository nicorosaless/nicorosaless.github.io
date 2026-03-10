import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const username = 'nicorosaless'

function run(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
}

const graphqlQuery = `query {
  user(login: "${username}") {
    name
    bio
    avatarUrl
    location
    company
    websiteUrl
    twitterUsername
    socialAccounts(first: 20) {
      nodes {
        provider
        url
      }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          url
          stargazerCount
          primaryLanguage {
            name
            color
          }
        }
      }
    }
  }
}`

const graph = JSON.parse(run(`gh api graphql -f query='${graphqlQuery}'`))
const repos = JSON.parse(run(`gh api --paginate "users/${username}/repos?per_page=100&sort=updated"`))

const projectRepos = repos
  .filter((repo) => !repo.fork)
  .filter((repo) => !['nicorosaless', 'nicorosaless.github.io'].includes(repo.name))
  .map((repo) => ({
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    homepage: repo.homepage,
    language: repo.language,
    stars: repo.stargazers_count,
    updatedAt: repo.updated_at,
  }))

const output = {
  generatedAt: new Date().toISOString(),
  username,
  profile: graph.data.user,
  pinnedProjects: graph.data.user.pinnedItems.nodes,
  allProjects: projectRepos,
  stats: {
    projectCount: projectRepos.length,
    pinnedCount: graph.data.user.pinnedItems.nodes.length,
  },
}

const filePath = resolve('src/data/github.generated.json')
mkdirSync(dirname(filePath), { recursive: true })
writeFileSync(filePath, JSON.stringify(output, null, 2) + '\n')

console.log(`Wrote ${filePath}`)
