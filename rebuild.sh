#!/usr/bin/env bash
set -euo pipefail

# Resolve absolute path to script directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

# Link ~/.dotfiles to this checkout the first time, and never move it after:
# every ~/.claude link goes through it, so a run from another checkout (a
# worktree) would point them all into a folder that goes away
if [[ ! -e ~/.dotfiles && ! -L ~/.dotfiles ]]; then
  ln -s "$DIR" ~/.dotfiles
elif [[ "$(readlink -f ~/.dotfiles)" != "$DIR" ]]; then
  echo "Error: ~/.dotfiles is $(readlink -f ~/.dotfiles), not this checkout ($DIR). Run ~/.dotfiles/rebuild.sh, or remove ~/.dotfiles to move it here."
  exit 1
fi

# Allow overriding the configuration name via argument, default to 'windows'
CONFIG_NAME="${1:-windows}"

exec sudo nixos-rebuild switch --flake ~/.dotfiles#"${CONFIG_NAME}"
