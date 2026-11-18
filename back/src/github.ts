const APP_GIT_PAT = process.env.APP_GIT_PAT;

let octokit: any = null;

export async function getOctokit() {
  if (!octokit) {
    const { Octokit } = await import('@octokit/rest');
    octokit = new Octokit({ auth: APP_GIT_PAT });
  }
  return octokit;
}
