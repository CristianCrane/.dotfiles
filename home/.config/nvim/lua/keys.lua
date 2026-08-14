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

-- ===================================================================
-- 3. <leader>x: Diagnostics / Line Inspection
-- ===================================================================
map("n", "<leader>xd", vim.diagnostic.open_float, { desc = "Line Diagnostics" })
map("n", "<leader>xq", vim.diagnostic.setloclist, { desc = "Quickfix List" })
map("n", "[d", vim.diagnostic.goto_prev, { desc = "Previous Diagnostic" })
map("n", "]d", vim.diagnostic.goto_next, { desc = "Next Diagnostic" })

-- save by pressing escape
vim.keymap.set('n', '<Esc>', ':w<CR>', { desc = 'Save' })

-- select all
vim.keymap.set('n', '<C-a>', 'ggVG', { desc = 'Select All' })

-- pasting over a selection no longer clobbers clipboard
vim.cmd([[ xnoremap <expr> p 'pgv"'.v:register.'y' ]])
