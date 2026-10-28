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

local function active_pane_info(tab)
  for _, p in ipairs(tab:panes_with_info()) do
    if p.is_active then return p end
  end
end

-- Grow (+1) or shrink (-1) the active pane along the axis of the split it belongs to
local function smart_resize(window, pane, sign)
  local tab = pane:tab()
  local me = active_pane_info(tab)
  local function neighbor(dir)
    local n = tab:get_pane_direction(dir)
    if not n then return nil end
    for _, p in ipairs(tab:panes_with_info()) do
      if p.pane:pane_id() == n:pane_id() then return p end
    end
  end
  local up, down, left, right = neighbor('Up'), neighbor('Down'), neighbor('Left'), neighbor('Right')

  -- a neighbor spanning exactly our columns/rows is our direct sibling, so prefer that axis
  local function same_cols(n) return n and n.left == me.left and n.width == me.width end
  local function same_rows(n) return n and n.top == me.top and n.height == me.height end
  local vertical
  if same_cols(up) or same_cols(down) then
    vertical = true
  elseif same_rows(left) or same_rows(right) then
    vertical = false
  elseif up or down or left or right then
    vertical = (up or down) ~= nil
  else
    return
  end

  local dim = vertical and 'height' or 'width'
  local step = vertical and 2 or 5
  local fwd, back = 'Right', 'Left'
  if vertical then fwd, back = 'Down', 'Up' end

  -- AdjustPaneSize moves a divider, so whether that grows or shrinks us depends on
  -- which side of it we're on; try one way and correct if it went the wrong way
  window:perform_action(act.AdjustPaneSize { fwd, step }, pane)
  local delta = active_pane_info(tab)[dim] - me[dim]
  if delta * sign <= 0 then
    window:perform_action(act.AdjustPaneSize { back, step + math.abs(delta) }, pane)
  end
end

config.keys = {
  -- passthroughs
  { key = 'Tab',   mods = 'CTRL',       action = wezterm.action.SendString '\x1b[27;5;9~' },
  { key = 'Tab',   mods = 'CTRL|SHIFT', action = wezterm.action.SendString '\x1b[27;6;9~' },
  { key = 'Space', mods = 'CTRL',       action = wezterm.action.SendKey { key = 'Space', mods = 'CTRL' }, },
  { key = 'Enter', mods = 'SHIFT',      action = wezterm.action.SendString('\27[13;2u') },

  -- Split bindings
  {
    key = 's',
    mods = 'CTRL|SHIFT|ALT',
    -- split along the longer side, measured in pixels since cells are taller than wide
    action = wezterm.action_callback(function(_, pane)
      local dims = pane:get_dimensions()
      pane:split { direction = dims.pixel_width > dims.pixel_height and 'Right' or 'Bottom' }
    end),
  },
  { key = 'q', mods = 'CTRL|SHIFT|ALT', action = act.CloseCurrentPane { confirm = false } },
  { key = 'n', mods = 'CTRL|SHIFT|ALT', action = act.ActivatePaneDirection 'Next' },
  { key = 'p', mods = 'CTRL|SHIFT|ALT', action = act.ActivatePaneDirection 'Prev' },
  { key = 'f', mods = 'CTRL|SHIFT|ALT', action = act.PaneSelect },
  {
    key = 'i',
    mods = 'CTRL|SHIFT|ALT',
    action = wezterm.action_callback(function(win, pane) smart_resize(win, pane, 1) end),
  },
  {
    key = 'd',
    mods = 'CTRL|SHIFT|ALT',
    action = wezterm.action_callback(function(win, pane) smart_resize(win, pane, -1) end),
  },
}

return config
