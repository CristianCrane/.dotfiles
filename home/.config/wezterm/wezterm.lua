local wezterm = require 'wezterm'
local config = wezterm.config_builder()

config.default_domain = 'WSL:NixOS'
config.default_cwd = [[\\wsl.localhost\NixOS\home\cris]]

config.color_scheme = "OneDark (base16)"

config.font = wezterm.font("Hack Nerd Font")
config.font_size = 11.0

config.window_background_opacity = 0.8
config.win32_system_backdrop = 'Acrylic'
config.hide_tab_bar_if_only_one_tab = true

return config
