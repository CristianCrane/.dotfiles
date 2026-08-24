local map = vim.keymap.set

-- base movement
map({'n', 'v', 'o'}, 'j', 'h', { remap = false }) -- left
map({'n', 'v', 'o'}, 'i', 'k', { remap = false }) -- up
map({'n', 'v', 'o'}, 'k', 'j', { remap = false }) -- down
map({'n', 'v', 'o'}, 'l', 'l', { remap = false }) -- right

-- word movement
vim.keymap.set({'n', 'v', 'o'}, 'u', 'b', { remap = false, desc = "Word Back" })
vim.keymap.set({'n', 'v', 'o'}, 'U', 'B', { remap = false, desc = "WORD Back" })
vim.keymap.set({'n', 'v', 'o'}, 'o', 'w', { remap = false, desc = "Word Forward" })
vim.keymap.set({'n', 'v', 'o'}, 'O', 'W', { remap = false, desc = "WORD Forward" })
vim.keymap.set({'n', 'v', 'o'}, 'p', 'e', { remap = false, desc = "Word End" })
vim.keymap.set({'n', 'v', 'o'}, 'P', 'E', { remap = false, desc = "WORD End" })

-- commands
vim.keymap.set('n', 'z', 'u', { remap = false, desc = "Undo" })
vim.keymap.set('n', 'Z', '<C-r>', { remap = false, desc = "Redo" })

-- Directional Insert Mode (Shift + ijkl)
map('n', 'J', 'i', { remap = false }) -- Insert Left
map('n', 'L', 'a', { remap = false }) -- Insert Right
map('n', 'I', 'O', { remap = false }) -- Insert Up (new line above)
map('n', 'K', 'o', { remap = false }) -- Insert Down (new line below)

-- ===================================================================
-- 1. Unleadered Fast Navigation (Vim Defaults / Conventions)
-- ===================================================================
map("n", "gd", vim.lsp.buf.definition, { desc = 'Go to Definition' })
map("n", "gr", vim.lsp.buf.references, { desc = 'Go to References' })
map("n", "gI", vim.lsp.buf.implementation, { desc = 'Go to Implementation' })
map("n", "gy", vim.lsp.buf.type_definition, { desc = 'Go to Type Definition' })
map("n", "gq", vim.lsp.buf.hover, { desc = 'Hover Documentation' })

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
