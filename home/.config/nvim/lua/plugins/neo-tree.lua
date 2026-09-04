return {
  "nvim-neo-tree/neo-tree.nvim",
  branch = "v3.x",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "MunifTanjim/nui.nvim",
    "nvim-tree/nvim-web-devicons",
  },
  lazy = false, -- neo-tree will lazily load itself
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
        -- CWD Navigation
        ["<Left>"] = "navigate_up",
        ["<Right>"] = "set_root",

        -- Navigation & Expansion
        ["<CR>"] = "open",
        -- Normal Mode Cursor Navigation
        ["i"] = function() vim.cmd("normal! k") end,
        ["k"] = function() vim.cmd("normal! j") end,
        ["l"] = "open",
        ["j"] = "close_node",
        ["e"] = "expand_all_nodes",
        ["E"] = "close_all_nodes",

        -- File Operations
        ["d"] = "delete",
        ["r"] = "rename",
        ["c"] = "copy_to_clipboard",
        ["m"] = "move",
        ["R"] = "refresh",
        ["v"] = "paste_from_clipboard",
        ["x"] = "cut_to_clipboard",
        ["p"] = "toggle_preview",
        ["<C-f>"] = "fuzzy_finder",

        -- Explicit Unbinds
        ["<BS>"] = false,
        ["C"] = false,
        ["h"] = false,
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
