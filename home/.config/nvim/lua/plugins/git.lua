return {
  {
    'NeogitOrg/neogit',
    dependencies = { 'nvim-lua/plenary.nvim', 'sindrets/diffview.nvim' },
    opts = {
      highlight = {
        NeogitDiffAddHighlight = { fg = "#3cbc8f", bg = "#004a53" },
        NeogitDiffDeleteHighlight = { fg = "#fea185", bg = "#632e32" },
      },
      mappings = {
        status = {
          -- 2. Map ijkl movements using custom function callbacks
          ["i"] = "MoveUp",
          ["k"] = "MoveDown",

          -- 3. Rebind the displaced Ignore command (formerly 'i') to another key
          ["I"] = "InitRepo",
        },
      },
    },
  },
  {
    'lewis6991/gitsigns.nvim',
    event = 'BufWinEnter',
    opts = { current_line_blame = true },
  },
}
