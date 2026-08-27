return {
  "nvim-neo-tree/neo-tree.nvim",
  branch = "v3.x",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "MunifTanjim/nui.nvim",
    "nvim-tree/nvim-web-devicons",
  },
  lazy = false, -- neo-tree will lazily load itself
  keys = {
    {
      "<leader>d",
      function()
        local neo_tree_win = nil
        -- check if neotree is open already by finding its window
        for _, win in ipairs(vim.api.nvim_tabpage_list_wins(0)) do
          local buf = vim.api.nvim_win_get_buf(win)
          if vim.bo[buf].filetype == "neo-tree" then
            neo_tree_win = win
            break
          end
        end
        local current_win = vim.api.nvim_get_current_win()
        if neo_tree_win and current_win == neo_tree_win then
          vim.cmd("Neotree close")
        elseif neo_tree_win then
          vim.api.nvim_set_current_win(neo_tree_win)
        else
          vim.cmd("Neotree show focus")
        end
      end,
      desc = "File tree"
    },
  },
  opts = {
    close_if_last_window = true,
    popup_border_style = "rounded",
    enable_git_status = true,
    enable_diagnostics = true,
    filesystem = {
      filtered_items = {
        visible = true,
        hide_dotfiles = false,
        hide_gitignored = false,
        never_show = {
          ".git",
        },
        always_show = {},
      },
      follow_current_file = {
        enabled = true,
      },
    },
    window = {
      mappings = {
        ["<space>"] = "none",
        -- vertical cursor navigation
        ["i"] = function() vim.cmd("normal! k") end,
        ["k"] = function() vim.cmd("normal! j") end,
        -- directory tree collapse / expand
        ["j"] = "close_node",
        ["l"] = "open",
        ["h"] = "none",
      },
    },
    default_component_configs = {
      git_status = {
        symbols = {
          -- Change type indicators
          added     = "󰐕",
          modified  = "󰏫",
          deleted   = "󰍵",
          renamed   = "󰁕",

          -- Staging / state status indicators
          untracked = "󰋗",
          ignored   = "󰈉",
          unstaged  = "󰄱",
          staged    = "󰄵",
          conflict  = "",
        },
      },
    },
  },
}
