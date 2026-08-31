local o = vim.opt

vim.g.mapleader = ' '             -- space is leader
o.expandtab = true                -- spaces, not tabs
o.shiftwidth = 2                  -- 2 spaces per indent level
o.number = true                   -- absolute number on the cursor line, relative elsewhere
o.relativenumber = true           -- relative line numbers for fast jumps
o.ignorecase = true               -- search is case-insensitive by default
o.smartcase = true                -- case-sensitive only when typing a capital
o.clipboard = 'unnamedplus'       -- share system clipboard
o.scrolloff = 16                  -- keep cursor away from screen edge
o.undofile = true                 -- persistent undo across sessions
o.hlsearch = false                -- disable search highlighting
o.showmode = false                -- disable status indicator in the cmd bar
o.fillchars:append({ eob = " " }) -- get rid of the end of buffer squiggles
o.cursorline = true               -- enable the current line highlight
o.winborder = "rounded"           -- rounded borders for all floating windows

vim.diagnostic.config({
  float = {
    border = "rounded",
    source = true,
    max_width = 100,
    prefix = function(diagnostic, i)
      return string.format("%d. ", i), "Comment"
    end,
    win_options = {
      winblend = 0,
      wrap = true,
    },
  },
  virtual_text = false,
  signs = true,
  underline = true,
  update_in_insert = false,
  severity_sort = true,
})
