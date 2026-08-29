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

            -- Determine the folder name (:tcd) or custom :TabRename
            local tab_id = tab.id
            local name = vim.t[tab_id].tab_name
            if not name or name == "" then
              local winnr = vim.fn.tabpagewinnr(tab_id)
              local cwd = vim.fn.getcwd(winnr, tab_id)
              name = vim.fn.fnamemodify(cwd, ":t")
            end

            -- Return the individual tab element
            return {
              { " " .. name .. " ", hl = hl },
            }
          end),

          -- 2. Fill remaining space to the right
          line.spacer(),
        }
      end,
      option = {
        tab_name = {
          name_fallback = function(tabid)
            return "Tab"
          end,
        },
      },
    })
  end,
}
