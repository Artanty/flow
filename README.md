# OnPush GitHub App 

## Requirements

https://docs.github.com/en/webhooks/webhook-events-and-payloads#push

This event occurs when there is a push to a repository branch. This includes when a commit is pushed, when a commit tag is pushed, when a branch is deleted, when a tag is deleted, or when a repository is created from a template. To subscribe to only branch and tag deletions, use the delete webhook event.

To subscribe to this event, a GitHub App must have at least read-level access for the "Contents" repository permission.

Events will not be created if more than 5000 branches are pushed at once. Events will not be created for tags when more than three tags are pushed at once.

Availability for push
- Repositories
- Organizations
- GitHub Apps

Webhook payload object for push
Webhook request body parameters
Name, Type, Description
after string Required
The SHA of the most recent commit on ref after the push.

base_ref string or null Required
before string Required
The SHA of the most recent commit on ref before the push.

commits array of objects Required
An array of commit objects describing the pushed commits. (Pushed commits are all commits that are included in the compare between the before commit and the after commit.) The array includes a maximum of 2048 commits. If necessary, you can use the Commits API to fetch additional commits.

Properties of commits
compare string Required
URL that shows the changes in this ref update, from the before commit to the after commit. For a newly created ref that is directly based on the default branch, this is the comparison between the head of the default branch and the after commit. Otherwise, this shows all commits until the after commit.

created boolean Required
Whether this push created the ref.

deleted boolean Required
Whether this push deleted the ref.

enterprise object
An enterprise on GitHub. Webhook payloads contain the enterprise property when the webhook is configured on an enterprise account or an organization that's part of an enterprise account. For more information, see "About enterprise accounts."

forced boolean Required
Whether this push was a force push of the ref.

head_commit object or null Required
Properties of head_commit
installation object
The GitHub App installation. Webhook payloads contain the installation property when the event is configured for and sent to a GitHub App. For more information, see "Using webhooks with GitHub Apps."

organization object
A GitHub organization. Webhook payloads contain the organization property when the webhook is configured for an organization, or when the event occurs from activity in a repository owned by an organization.

pusher object Required
Metaproperties for Git author/committer information.

Properties of pusher
ref string Required
The full git ref that was pushed. Example: refs/heads/main or refs/tags/v3.14.1.

repository object Required
A git repository

sender object
A GitHub user.

## Examples

```
const app = new App({ appId, privateKey });
for await (const { octokit, repository } of app.eachRepository.iterator()) {}
```
### Push event payload (req.body)
```
{
  "ref": "refs/heads/main",
  "before": "61137280387fdd50314d2c3bfdd233c230f1484d",
  "after": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  "repository": {
    "id": 123456789,
    "node_id": "MDEwOlJlcG9zaXRvcnkxMjM0NTY3ODk=",
    "name": "my-repo",
    "full_name": "my-username/my-repo",
    "private": false,
    "owner": {
      "name": "my-username",
      "email": "my-username@example.com",
      "login": "my-username",
      "id": 987654321,
      "node_id": "MDQ6VXNlcjU0MzIx",
      "avatar_url": "https://avatars.githubusercontent.com/u/18100427?v=4",
      "gravatar_id": "",
      "url": "https://api.github.com/users/Artanty",
      "html_url": "https://github.com/Artanty",
      "followers_url": "https://api.github.com/users/Artanty/followers",
      "following_url": "https://api.github.com/users/Artanty/following{/other_user}",
      "gists_url": "https://api.github.com/users/Artanty/gists{/gist_id}",
      "starred_url": "https://api.github.com/users/Artanty/starred{/owner}{/repo}",
      "subscriptions_url": "https://api.github.com/users/Artanty/subscriptions",
      "organizations_url": "https://api.github.com/users/Artanty/orgs",
      "repos_url": "https://api.github.com/users/Artanty/repos",
      "events_url": "https://api.github.com/users/Artanty/events{/privacy}",
      "received_events_url": "https://api.github.com/users/Artanty/received_events",
      "type": "User",
      "user_view_type": "public",
      "site_admin": false
    },
    "html_url": "https://github.com/my-username/my-repo",
    "description": "This is a test repository",
    "fork": false,
    "url": "https://api.github.com/repos/my-username/my-repo",
    "forks_url": "https://api.github.com/repos/Artanty/shared-secrets/forks",
    "keys_url": "https://api.github.com/repos/Artanty/shared-secrets/keys{/key_id}",
    "collaborators_url": "https://api.github.com/repos/Artanty/shared-secrets/collaborators{/collaborator}",
    "teams_url": "https://api.github.com/repos/Artanty/shared-secrets/teams",
    "hooks_url": "https://api.github.com/repos/Artanty/shared-secrets/hooks",
    "issue_events_url": "https://api.github.com/repos/Artanty/shared-secrets/issues/events{/number}",
    "events_url": "https://api.github.com/repos/Artanty/shared-secrets/events",
    "assignees_url": "https://api.github.com/repos/Artanty/shared-secrets/assignees{/user}",
    "branches_url": "https://api.github.com/repos/Artanty/shared-secrets/branches{/branch}",
    "tags_url": "https://api.github.com/repos/Artanty/shared-secrets/tags",
    "blobs_url": "https://api.github.com/repos/Artanty/shared-secrets/git/blobs{/sha}",
    "git_tags_url": "https://api.github.com/repos/Artanty/shared-secrets/git/tags{/sha}",
    "git_refs_url": "https://api.github.com/repos/Artanty/shared-secrets/git/refs{/sha}",
    "trees_url": "https://api.github.com/repos/Artanty/shared-secrets/git/trees{/sha}",
    "statuses_url": "https://api.github.com/repos/Artanty/shared-secrets/statuses/{sha}",
    "languages_url": "https://api.github.com/repos/Artanty/shared-secrets/languages",
    "stargazers_url": "https://api.github.com/repos/Artanty/shared-secrets/stargazers",
    "contributors_url": "https://api.github.com/repos/Artanty/shared-secrets/contributors",
    "subscribers_url": "https://api.github.com/repos/Artanty/shared-secrets/subscribers",
    "subscription_url": "https://api.github.com/repos/Artanty/shared-secrets/subscription",
    "commits_url": "https://api.github.com/repos/Artanty/shared-secrets/commits{/sha}",
    "git_commits_url": "https://api.github.com/repos/Artanty/shared-secrets/git/commits{/sha}",
    "comments_url": "https://api.github.com/repos/Artanty/shared-secrets/comments{/number}",
    "issue_comment_url": "https://api.github.com/repos/Artanty/shared-secrets/issues/comments{/number}",
    "contents_url": "https://api.github.com/repos/Artanty/shared-secrets/contents/{+path}",
    "compare_url": "https://api.github.com/repos/Artanty/shared-secrets/compare/{base}...{head}",
    "merges_url": "https://api.github.com/repos/Artanty/shared-secrets/merges",
    "archive_url": "https://api.github.com/repos/Artanty/shared-secrets/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/Artanty/shared-secrets/downloads",
    "issues_url": "https://api.github.com/repos/Artanty/shared-secrets/issues{/number}",
    "pulls_url": "https://api.github.com/repos/Artanty/shared-secrets/pulls{/number}",
    "milestones_url": "https://api.github.com/repos/Artanty/shared-secrets/milestones{/number}",
    "created_at": 1633028400,
    "updated_at": "2023-10-01T12:34:56Z",
    "pushed_at": 1696123456,
    "git_url": "git://github.com/my-username/my-repo.git",
    "ssh_url": "git@github.com:my-username/my-repo.git",
    "clone_url": "https://github.com/my-username/my-repo.git",
    "homepage": null,
    "size": 1234,
    "stargazers_count": 10,
    "watchers_count": 10,
    "language": "JavaScript",
    "has_issues": true,
    "has_projects": true,
    "has_downloads": true,
    "has_wiki": true,
    "has_pages": false,
    "forks_count": 2,
    "archived": false,
    "disabled": false,
    "open_issues_count": 5,
    "license": null,
    "allow_forking": true,
    "is_template": false,
    "topics": [],
    "visibility": "public",
    "forks": 2,
    "open_issues": 5,
    "watchers": 10,
    "default_branch": "main"
  },
  "pusher": {
    "name": "my-username",
    "email": "my-username@example.com"
  },
  "sender": {
    "login": "my-username",
    "id": 987654321,
    "node_id": "MDQ6VXNlcjU0MzIx",
    "avatar_url": "https://avatars.githubusercontent.com/u/987654321?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/my-username",
    "html_url": "https://github.com/my-username",
    "followers_url": "https://api.github.com/users/my-username/followers",
    "following_url": "https://api.github.com/users/my-username/following{/other_user}",
    "gists_url": "https://api.github.com/users/my-username/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/my-username/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/my-username/subscriptions",
    "organizations_url": "https://api.github.com/users/my-username/orgs",
    "repos_url": "https://api.github.com/users/my-username/repos",
    "events_url": "https://api.github.com/users/my-username/events{/privacy}",
    "received_events_url": "https://api.github.com/users/my-username/received_events",
    "type": "User",
    "site_admin": false
  },
  "created": false,
  "deleted": false,
  "forced": false,
  "base_ref": null,
  "compare": "https://github.com/my-username/my-repo/compare/61137280387f...1a2b3c4d5e6f",
  "commits": [
    {
      "id": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
      "tree_id": "abcdef1234567890abcdef1234567890abcdef12",
      "distinct": true,
      "message": "Update README.md",
      "timestamp": "2023-10-01T12:34:56Z",
      "url": "https://github.com/my-username/my-repo/commit/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
      "author": {
        "name": "my-username",
        "email": "my-username@example.com",
        "username": "my-username"
      },
      "committer": {
        "name": "my-username",
        "email": "my-username@example.com",
        "username": "my-username"
      },
      "added": [],
      "removed": [],
      "modified": ["README.md"]
    }
  ],
  "head_commit": {
    "id": "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    "tree_id": "abcdef1234567890abcdef1234567890abcdef12",
    "distinct": true,
    "message": "Update README.md",
    "timestamp": "2023-10-01T12:34:56Z",
    "url": "https://github.com/my-username/my-repo/commit/1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    "author": {
      "name": "my-username",
      "email": "my-username@example.com",
      "username": "my-username"
    },
    "committer": {
      "name": "my-username",
      "email": "my-username@example.com",
      "username": "my-username"
    },
    "added": [],
    "removed": [],
    "modified": ["README.md"]
  },
  "installation": {
    "id": 12345,
    "node_id": "MDIzOkludGVncmF0aW9uSW5zdGFsbGF0aW9uMTIzNDU="
  }
}
```

### Octokit object
```
<ref *1> OctokitWithDefaults {
  request: [Function: newApi] {
    endpoint: [Function: bound endpointWithDefaults] {
      DEFAULTS: [Object],
      defaults: [Function: bound withDefaults],
      merge: [Function: bound merge],
      parse: [Function: parse]
    },
    defaults: [Function: bound withDefaults]
  },
  graphql: [Function: newApi] {
    defaults: [Function: bound withDefaults],
    endpoint: [Function: bound endpointWithDefaults] {
      DEFAULTS: [Object],
      defaults: [Function: bound withDefaults],
      merge: [Function: bound merge],
      parse: [Function: parse]
    }
  },
  log: {
    debug: [Function: noop],
    info: [Function: noop],
    warn: [Function: bound bound ],
    error: [Function: bound bound ]
  },
  hook: [Function: bound register] {
    api: {
      remove: [Function: bound removeHook],
      before: [Function: bound addHook],
      error: [Function: bound addHook],
      after: [Function: bound addHook],
      wrap: [Function: bound addHook]
    },
    remove: [Function: bound removeHook],
    before: [Function: bound addHook],
    error: [Function: bound addHook],
    after: [Function: bound addHook],
    wrap: [Function: bound addHook]
  },
  auth: [Function: bound auth] AsyncFunction {
    hook: [Function: bound hook] AsyncFunction
  },
  actions: { octokit: [Circular *1], scope: 'actions', cache: {} },
  activity: { octokit: [Circular *1], scope: 'activity', cache: {} },
  apps: { octokit: [Circular *1], scope: 'apps', cache: {} },
  billing: { octokit: [Circular *1], scope: 'billing', cache: {} },
  checks: { octokit: [Circular *1], scope: 'checks', cache: {} },
  codeScanning: { octokit: [Circular *1], scope: 'codeScanning', cache: {} },
  codesOfConduct: { octokit: [Circular *1], scope: 'codesOfConduct', cache: {} },
  codespaces: { octokit: [Circular *1], scope: 'codespaces', cache: {} },
  copilot: { octokit: [Circular *1], scope: 'copilot', cache: {} },
  dependabot: { octokit: [Circular *1], scope: 'dependabot', cache: {} },
  dependencyGraph: { octokit: [Circular *1], scope: 'dependencyGraph', cache: {} },
  emojis: { octokit: [Circular *1], scope: 'emojis', cache: {} },
  gists: { octokit: [Circular *1], scope: 'gists', cache: {} },
  git: { octokit: [Circular *1], scope: 'git', cache: {} },
  gitignore: { octokit: [Circular *1], scope: 'gitignore', cache: {} },
  interactions: { octokit: [Circular *1], scope: 'interactions', cache: {} },
  issues: { octokit: [Circular *1], scope: 'issues', cache: {} },
  licenses: { octokit: [Circular *1], scope: 'licenses', cache: {} },
  markdown: { octokit: [Circular *1], scope: 'markdown', cache: {} },
  meta: { octokit: [Circular *1], scope: 'meta', cache: {} },
  migrations: { octokit: [Circular *1], scope: 'migrations', cache: {} },
  oidc: { octokit: [Circular *1], scope: 'oidc', cache: {} },
  orgs: { octokit: [Circular *1], scope: 'orgs', cache: {} },
  packages: { octokit: [Circular *1], scope: 'packages', cache: {} },
  projects: { octokit: [Circular *1], scope: 'projects', cache: {} },
  pulls: { octokit: [Circular *1], scope: 'pulls', cache: {} },
  rateLimit: { octokit: [Circular *1], scope: 'rateLimit', cache: {} },
  reactions: { octokit: [Circular *1], scope: 'reactions', cache: {} },
  repos: { octokit: [Circular *1], scope: 'repos', cache: {} },
  search: { octokit: [Circular *1], scope: 'search', cache: {} },
  secretScanning: { octokit: [Circular *1], scope: 'secretScanning', cache: {} },
  securityAdvisories: { octokit: [Circular *1], scope: 'securityAdvisories', cache: {} },
  teams: { octokit: [Circular *1], scope: 'teams', cache: {} },
  users: { octokit: [Circular *1], scope: 'users', cache: {} },
  rest: {
    actions: { octokit: [Circular *1], scope: 'actions', cache: {} },
    activity: { octokit: [Circular *1], scope: 'activity', cache: {} },
    apps: { octokit: [Circular *1], scope: 'apps', cache: {} },
    billing: { octokit: [Circular *1], scope: 'billing', cache: {} },
    checks: { octokit: [Circular *1], scope: 'checks', cache: {} },
    codeScanning: { octokit: [Circular *1], scope: 'codeScann
```

### AppWithDefaults
creation:
```
const octokit = new App({
      appId: APP_ID,
      privateKey: PRIVATE_KEY,
      webhooks: {
        secret: WEBHOOK_SECRET
      },
    })
```
result:
```
AppWithDefaults {
  octokit: OctokitWithDefaults {
    request: [Function: newApi] {
      endpoint: [Function],
      defaults: [Function: bound withDefaults]
    },
    graphql: [Function: newApi] {
      defaults: [Function: bound withDefaults],
      endpoint: [Function],
      paginate: [AsyncFunction]
    },
    log: {
      debug: [Function: noop],
      info: [Function: noop],
      warn: [Function: bound bound ],
      error: [Function: bound bound ]
    },
    hook: [Function: bound register] {
      api: [Object],
      remove: [Function: bound removeHook],
      before: [Function: bound addHook],
      error: [Function: bound addHook],
      after: [Function: bound addHook],
      wrap: [Function: bound addHook]
    },
    auth: [Function: bound auth] AsyncFunction {
      hook: [Function: bound hook] AsyncFunction
    },
    rest: {
      actions: [Object],
      activity: [Object],
      apps: [Object],
      billing: [Object],
      checks: [Object],
      codeScanning: [Object],
      codesOfConduct: [Object],
      codespaces: [Object],
      copilot: [Object],
      dependabot: [Object],
      dependencyGraph: [Object],
      emojis: [Object],
      gists: [Object],
      git: [Object],
      gitignore: [Object],
      interactions: [Object],
      issues: [Object],
      licenses: [Object],
      markdown: [Object],
      meta: [Object],
      migrations: [Object],
      orgs: [Object],
      packages: [Object],
      projects: [Object],
      pulls: [Object],
      rateLimit: [Object],
      reactions: [Object],
      repos: [Object],
      search: [Object],
      secretScanning: [Object],
      securityAdvisories: [Object],
      teams: [Object],
      users: [Object]
    },
    paginate: [Function: bound paginate] { iterator: [Function: bound iterator] },
    retry: { retryRequest: [Function: retryRequest] }
  },
  log: {
    debug: [Function: debug],
    info: [Function: info],
    warn: [Function: bound bound ],
    error: [Function: bound bound ]
  },
  webhooks: Webhooks {
    sign: [Function: bound sign] AsyncFunction,
    verify: [Function: bound verify] AsyncFunction,
    on: [Function: bound receiverOn],
    onAny: [Function: bound receiverOnAny],
    onError: [Function: bound receiverOnError],
    removeListener: [Function: bound removeListener],
    receive: [Function: bound receiverHandle],
    verifyAndReceive: [Function: bound verifyAndReceive] AsyncFunction
  },
  getInstallationOctokit: [Function: bound getInstallationOctokit] AsyncFunction,
  eachInstallation: [Function: bound eachInstallation] AsyncFunction {
    iterator: [Function: bound eachInstallationIterator]
  },
  eachRepository: [Function: bound eachRepository] AsyncFunction {
    iterator: [Function: bound eachRepositoryIterator]
  }
}
```
### Octokit interface
```
export declare class App<TOptions extends Options = Options> {
    static VERSION: string;
    static defaults<TDefaults extends Options, S extends Constructor<App<TDefaults>>>(this: S, defaults: Partial<TDefaults>): {
        new (...args: any[]): {
            octokit: OctokitType<TDefaults>;
            webhooks: Webhooks<{
                octokit: OctokitType<TDefaults>;
            }>;
            oauth: OAuthApp<{
                clientType: "github-app";
                Octokit: OctokitClassType<TDefaults>;
            }>;
            getInstallationOctokit: GetInstallationOctokitInterface<OctokitType<TDefaults>>;
            eachInstallation: EachInstallationInterface<OctokitType<TDefaults>>;
            eachRepository: EachRepositoryInterface<OctokitType<TDefaults>>;
            log: {
                [key: string]: unknown;
                debug: (message: string, additionalInfo?: object | undefined) => void;
                info: (message: string, additionalInfo?: object | undefined) => void;
                warn: (message: string, additionalInfo?: object | undefined) => void;
                error: (message: string, additionalInfo?: object | undefined) => void;
            };
        };
    } & S;
    octokit: OctokitType<TOptions>;
    webhooks: Webhooks<{
        octokit: OctokitType<TOptions>;
    }>;
    oauth: OAuthApp<{
        clientType: "github-app";
        Octokit: OctokitClassType<TOptions>;
    }>;
    getInstallationOctokit: GetInstallationOctokitInterface<OctokitType<TOptions>>;
    eachInstallation: EachInstallationInterface<OctokitType<TOptions>>;
    eachRepository: EachRepositoryInterface<OctokitType<TOptions>>;
    log: {
        debug: (message: string, additionalInfo?: object) => void;
        info: (message: string, additionalInfo?: object) => void;
        warn: (message: string, additionalInfo?: object) => void;
        error: (message: string, additionalInfo?: object) => void;
        [key: string]: unknown;
    };
    constructor(options: ConstructorOptions<TOptions>);
}
```