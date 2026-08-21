local map = vim.keymap.set

-- ===================================================================
-- 1. Unleadered Fast Navigation (Vim Defaults / Conventions)
-- ===================================================================
map("n", "gd", vim.lsp.buf.definition, { desc = 'Go to Definition' })
map("n", "gr", vim.lsp.buf.references, { desc = 'Go to References' })
map("n", "gI", vim.lsp.buf.implementation, { desc = 'Go to Implementation' })
map("n", "gy", vim.lsp.buf.type_definition, { desc = 'Go to Type Definition' })
map("n", "K", vim.lsp.buf.hover, { desc = 'Hover Documentation' })

-- ===================================================================
-- 2. <leader>c: Code Actions & Refactoring
-- ===================================================================
map({ "n", "v" }, "<leader>ca", vim.lsp.buf.code_action, { desc = "Code Action" })
map("n", "<leader>cr", vim.lsp.buf.rename, { desc = "Rename Symbol" })

map("n", "<leader>co", function()
  vim.lsp.buf.code_action({
    apply = true,
    context = {
      only = { "source.organizeImports" },
      diagnostics = {},
    },
  })
end, { desc = "Organize Imports" })

map("n", "<leader>ci", function()
  vim.lsp.buf.code_action({
    apply = true,
    context = {
      only = { "source.addMissingImports" },
      diagnostics = {},
    },
  })
end, { desc = "Add Missing Imports" })

map("n", "<leader>cf", function()
  require("conform").format({
    async = true,
    lsp_fallback = true,
  })
end, { desc = "Format current file" })

-- ===================================================================
-- 3. <leader>x: Diagnostics / Line Inspection
-- ===================================================================
map("n", "<leader>xd", vim.diagnostic.open_float, { desc = "Line Diagnostics" })
map("n", "<leader>xq", vim.diagnostic.setloclist, { desc = "Quickfix List" })
map("n", "[d", vim.diagnostic.goto_prev, { desc = "Previous Diagnostic" })
map("n", "]d", vim.diagnostic.goto_next, { desc = "Next Diagnostic" })

-- ===================================================================
-- Git Keymaps (<leader>g prefix)
-- ===================================================================

-- Open Neogit interface
map("n", "<leader>gg", function()
  require("neogit").open()
end, { desc = "Neogit Status" })

-- Neo-tree Git Status (Uncommitted changes vs HEAD)
map("n", "<leader>gs", "<cmd>Neotree float git_status<CR>", {
  desc = "Git Status Float (HEAD)",
})

-- Neo-tree Git Status (Cumulative changes vs main branch)
map("n", "<leader>gb", "<cmd>Neotree float git_status git_base=main<CR>", {
  desc = "Git Status Float (vs main)",
})

-- ===================================================================
-- Normalize Copy/Pasting
-- ===================================================================

vim.opt.clipboard = "unnamedplus" -- sync default register with system clipboard
map("x", "p", 'P', { desc = "Paste without overwriting clipboard" })

-- ===================================================================
-- Misc
-- ===================================================================

-- select all
map('n', '<C-a>', 'ggVG', { desc = 'Select All' })

-- save by pressing escape
map('n', '<Esc>', ':w<CR>', { desc = 'Save' })

-- reload theme
map("n", "<leader>r", function()
  package.loaded["theme"] = nil
  require("theme")
  print("Theme reloaded!")
end, { desc = "Reload theme" })
