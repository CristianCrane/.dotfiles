local wezterm = require 'wezterm'
local config = wezterm.config_builder()

config.default_domain = 'WSL:NixOS'
config.default_cwd = [[\\wsl.localhost\NixOS\home\cris]]

config.font = wezterm.font_with_fallback({
  "JetBrains Mono",
  "Hack Nerd Font"
})
config.font_size = 11.0

config.hide_tab_bar_if_only_one_tab = true

return config
