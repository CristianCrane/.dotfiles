# Change

Each change leaves the codebase with less entropy, never more. Before the first edit of any change in a git repo, load the `change` skill: it surveys the patterns the change touches, gets a fresh review before the PR, and sets the PR's Change section. Hooks hold to it: edits wait for the survey and its plan review, and `gh pr create` waits for a review with no open change findings.

# Evidence

A cause is a claim until evidence shows it, and so is what you say about how code behaves when someone will decide on it: a reproduction, a trace, numbers before and after, a test red on the old code, each taken as the code runs (the same handler, PATH, shell, data). Give each cause its evidence; an issue names its symptom until then. Time things on a quiet machine: check the load and the test runs already going first, and give those numbers beside the timing. In long work, a line now and then says what's running, what it waits on, and the numbers so far.
