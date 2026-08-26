local map = vim.keymap.set

-- base movement
map({'n', 'v', 'o'}, 'j', 'h', { remap = false }) -- left
map({'n', 'v', 'o'}, 'i', 'k', { remap = false }) -- up
map({'n', 'v', 'o'}, 'k', 'j', { remap = false }) -- down
map({'n', 'v', 'o'}, 'l', 'l', { remap = false }) -- right
map({'n', 'v', 'o'}, 'm', '^', { remap = false, desc = "Line Home (first character)" })
map({'n', 'v', 'o'}, '.', '$', { remap = false, desc = "Line End" })

-- word movement
map({'n', 'v', 'o'}, 'u', 'b', { remap = false, desc = "word Back" })
map({'n', 'v', 'o'}, 'U', 'B', { remap = false, desc = "WORD Back" })
map({'n', 'v', 'o'}, 'o', 'e', { remap = false, desc = "word Forward" })
map({'n', 'v', 'o'}, 'O', 'E', { remap = false, desc = "WORD Forward" })

-- commands
map('n', 'z', 'u', { remap = false, desc = "undo" })
map('n', 'Z', '<C-r>', { remap = false, desc = "redo" })
map('n', 'r', '.', { remap = false, desc = "repeat last change" })

-- cut, copy, paste, delete
map({'n', 'v'}, 'c', '"+y', { remap = false, desc = "Copy (Yank to System Clipboard)" })
map('n', 'cc', '"+yy', { remap = false, desc = "Copy Current Line" })
map({'n', 'v'}, 'x', '"+d', { remap = false, desc = "Cut (Delete to System Clipboard)" })
map('n', 'xx', '"+dd', { remap = false, desc = "Cut Current Line" })
map('n', 'v', '"+p', { remap = false, desc = "Paste from System Clipboard" })
map('x', 'v', '"_d"+P', { remap = false, desc = "Paste Over Selection (Preserve Clipboard)" })
map({'n', 'v'}, 'd', '"_d', { remap = false, desc = "Pure Delete (Black Hole)" })
map('n', 'dd', '"_dd', { remap = false, desc = "Pure Delete Current Line" })

-- directional insert modes
map('n', 'J', 'i', { remap = false }) -- Insert Left
map('n', 'L', 'a', { remap = false }) -- Insert Right
map('n', 'I', 'O', { remap = false }) -- Insert Up (new line above)
map('n', 'K', 'o', { remap = false }) -- Insert Down (new line below)

-- select (visual mode)
-- 's' enters Characterwise Visual mode (replaces native 'v')
map('n', 's', 'v', { remap = false, desc = "Visual Select (Character)" })
-- 'S' enters Linewise Visual mode (replaces native 'V')
map('n', 'S', 'V', { remap = false, desc = "Visual Select (Line)" })
-- 'Ctrl+s' enters Blockwise Visual mode (replaces native '<C-v>')
map('n', '<C-s>', '<C-v>', { remap = false, desc = "Visual Select (Block)" })

-- alter (change operator) deletes text into Black Hole register ("_) so clipboard is never clobbered
-- 'a' acts as the Alter operator taking any motion (e.g., aw", aw(, a., am)
vim.keymap.set({'n', 'v'}, 'a', '"_c', { remap = false, desc = "Alter (Delete & Insert, Black Hole)" })
-- 'aa' alters the entire line (equivalent to native cc)
vim.keymap.set('n', 'aa', '"_cc', { remap = false, desc = "Alter Entire Line" })
-- 'A' alters from cursor to end of line (equivalent to native c$)
vim.keymap.set('n', 'A', '"_c$', { remap = false, desc = "Alter to End of Line" })

-- text objects
map({'o', 'x'}, 'w', 'i', { remap = false, desc = "Within (Inner / Exclusive)" })
map({'o', 'x'}, 'W', 'a', { remap = false, desc = "Within (Around / Inclusive)" })

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
