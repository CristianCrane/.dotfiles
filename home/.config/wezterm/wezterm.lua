local wezterm = require 'wezterm'
local config = wezterm.config_builder()
local act = wezterm.action

config.default_domain = 'WSL:NixOS'
config.default_cwd = [[\\wsl.localhost\NixOS\home\cris]]

config.font = wezterm.font_with_fallback({
  "JetBrains Mono",
  "Hack Nerd Font"
})
config.font_size = 11.0

config.hide_tab_bar_if_only_one_tab = true
config.window_decorations = "RESIZE"

-- Detect if the active pane is running Neovim
local function is_vim(pane)
  local process_name = pane:get_foreground_process_name() or ""
  local process_title = pane:get_title() or ""
  return process_name:find("nvim") or process_name:find("vim") or process_title:find("nvim")
end

-- Send Alt+Key to Neovim if inside Neovim, otherwise move WezTerm focus directly
local function conditional_activate_pane(window, pane, pane_direction, vim_key)
  if is_vim(pane) then
    window:perform_action(act.SendKey({ key = vim_key, mods = 'ALT' }), pane)
  else
    window:perform_action(act.ActivatePaneDirection(pane_direction), pane)
  end
end

config.keys = {
  -- passthroughs
  { key = 'Tab',   mods = 'CTRL',       action = wezterm.action.SendString '\x1b[27;5;9~' },
  { key = 'Tab',   mods = 'CTRL|SHIFT', action = wezterm.action.SendString '\x1b[27;6;9~' },
  { key = 'Space', mods = 'CTRL',       action = wezterm.action.SendKey { key = 'Space', mods = 'CTRL' }, },
  { key = 'Enter', mods = 'SHIFT',      action = wezterm.action.SendString('\27[13;2u') },

  -- Navigation bindings
  {
    key = 'k',
    mods = 'ALT',
    action = wezterm.action_callback(function(win, pane)
      conditional_activate_pane(win, pane, 'Down', 'k')
    end),
  },
  {
    key = 'j',
    mods = 'ALT',
    action = wezterm.action_callback(function(win, pane)
      conditional_activate_pane(win, pane, 'Left', 'j')
    end),
  },
  {
    key = 'i',
    mods = 'ALT',
    action = wezterm.action_callback(function(win, pane)
      conditional_activate_pane(win, pane, 'Up', 'i')
    end),
  },
  {
    key = 'l',
    mods = 'ALT',
    action = wezterm.action_callback(function(win, pane)
      conditional_activate_pane(win, pane, 'Right', 'l')
    end),
  },
}

return config
