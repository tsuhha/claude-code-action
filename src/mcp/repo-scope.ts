export type RepoScope = {
  owner: string;
  repo: string;
};

export function resolveRepoScope(
  requested: { owner?: string; repo?: string },
  allowed: RepoScope,
): RepoScope {
  const { owner, repo } = requested;
  if (
    owner !== undefined &&
    owner.toLowerCase() !== allowed.owner.toLowerCase()
  ) {
    throw new Error(
      `Repository owner "${owner}" is not allowed. This tool can only operate on ${allowed.owner}/${allowed.repo}`,
    );
  }
  if (repo !== undefined && repo.toLowerCase() !== allowed.repo.toLowerCase()) {
    throw new Error(
      `Repository "${repo}" is not allowed. This tool can only operate on ${allowed.owner}/${allowed.repo}`,
    );
  }
  return { owner: allowed.owner, repo: allowed.repo };
}

export function assertAllowedCommentId(
  commentId: string | number,
  allowedCommentId: string | undefined,
): string {
  const requested = String(commentId).trim();
  if (!allowedCommentId || !/^\d+$/.test(allowedCommentId)) {
    throw new Error(
      "No tracking comment is configured; updating comments is not allowed",
    );
  }
  if (!/^\d+$/.test(requested) || requested !== allowedCommentId) {
    throw new Error(
      `Comment ${requested} is not allowed. Only the tracking comment ${allowedCommentId} can be updated`,
    );
  }
  return requested;
}
