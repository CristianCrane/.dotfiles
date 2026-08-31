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
config.window_decorations = "RESIZE"

config.keys = {
  { key = 'Tab',   mods = 'CTRL',       action = wezterm.action.SendString '\x1b[27;5;9~' },
  { key = 'Tab',   mods = 'CTRL|SHIFT', action = wezterm.action.SendString '\x1b[27;6;9~' },
  { key = 'Space', mods = 'CTRL',       action = wezterm.action.SendKey { key = 'Space', mods = 'CTRL' }, },
  { key = 'Enter', mods = 'SHIFT',      action = wezterm.action.SendString('\27[13;2u') },
}

return config
