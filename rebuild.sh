#!/usr/bin/env bash
set -euo pipefail

# Resolve absolute path to script directory
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"

# Safer symlink creation: only force if it's already a symlink or doesn't exist
if [[ -L ~/.dotfiles ]]; then
  # It's a symlink, safe to update
  ln -sfn "$DIR" ~/.dotfiles
elif [[ ! -e ~/.dotfiles ]]; then
  # Doesn't exist, safe to create
  ln -s "$DIR" ~/.dotfiles
else
  echo "Error: ~/.dotfiles exists and is not a symlink. Refusing to overwrite."
  exit 1
fi

# Allow overriding the configuration name via argument, default to 'wsl'
CONFIG_NAME="${1:-windows}"

exec sudo nixos-rebuild switch --flake ~/.dotfiles#"${CONFIG_NAME}"
