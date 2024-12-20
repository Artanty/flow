# OnPush GitHub App 

## Requirements

- Node.js 20 or higher
- A GitHub App subscribed to **Pull Request** events and with the following permissions:
  - Pull requests: Read & write
  - Metadata: Read-only
- (For local development) A tunnel to expose your local server to the internet (e.g. [smee](https://smee.io/), [ngrok](https://ngrok.com/) or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/))
- Your GitHub App Webhook must be configured to receive events at a URL that is accessible from the internet.

## Examples

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