# Shape

Each change leaves the codebase with less entropy, never more. Before the first edit of any change in a git repo, load the `shape` skill: it surveys the patterns the change touches, gets a fresh review before the PR, and sets the PR's Shape section. Hooks hold to it: edits wait for the survey and its plan review, and `gh pr create` waits for a review with no open shape findings.
