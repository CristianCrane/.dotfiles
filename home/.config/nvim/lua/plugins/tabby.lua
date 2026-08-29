return {
  "nanozuki/tabby.nvim",
  dependencies = { "nvim-tree/nvim-web-devicons" },
  config = function()
    local theme = {
      fill = "TabLineFill",       -- Background of the empty tab bar
      head = "TabLine",           -- Standard inactive tab highlight
      current_tab = "TabLineSel", -- Selected active tab highlight
      tab = "TabLine",            -- Unselected tab highlight
    }

    require("tabby").setup({
      line = function(line)
        return {
          -- 1. Loop through all active tabs
          line.tabs().foreach(function(tab)
            local is_active = tab.is_current()
            local hl = is_active and theme.current_tab or theme.tab

            -- tab.name() handles custom :TabRename automatically,
            -- and falls back to option.tab_name.name_fallback if unset.
            return {
              { " " .. tab.name() .. " ", hl = hl },
            }
          end),

          -- 2. Fill remaining space to the right
          line.spacer(),
        }
      end,
      option = {
        tab_name = {
          name_fallback = function(tabid)
            -- Safely resolve cwd using valid API handles + pcall safeguard
            local ok, cwd = pcall(function()
              local win_id = vim.api.nvim_tabpage_get_win(tabid)
              return vim.fn.getcwd(win_id, tabid)
            end)

            if ok and cwd and cwd ~= "" then
              return vim.fn.fnamemodify(cwd, ":t")
            end

            return "Tab"
          end,
        },
      },
    })
  end,
}
