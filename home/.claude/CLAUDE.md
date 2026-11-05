# Change

Each change leaves the codebase with less entropy, never more. Before the first edit of any change in a git repo, load the `change` skill: it surveys the patterns the change touches, gets a fresh review before the PR, and sets the PR's Change section. Hooks hold to it: edits wait for the survey and its plan review, and `gh pr create` waits for a review with no open change findings.
