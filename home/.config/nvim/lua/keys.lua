local map = vim.keymap.set

-- base movement
map({ 'n', 'v', 'o' }, 'j', 'h', { remap = false }) -- left
map({ 'n', 'v', 'o' }, 'i', 'k', { remap = false }) -- up
map({ 'n', 'v', 'o' }, 'k', 'j', { remap = false }) -- down
map({ 'n', 'v', 'o' }, 'l', 'l', { remap = false }) -- right
map({ 'n', 'v', 'o' }, 'm', '^', { remap = false, desc = "Line Home (first character)" })
map({ 'n', 'v', 'o' }, '.', '$', { remap = false, desc = "Line End" })

-- word movement
map({ 'n', 'v', 'o' }, 'u', 'b', { remap = false, desc = "word Back" })
map({ 'n', 'v', 'o' }, 'U', 'B', { remap = false, desc = "WORD Back" })
map({ 'n', 'v', 'o' }, 'o', 'e', { remap = false, desc = "word Forward" })
map({ 'n', 'v', 'o' }, 'O', 'E', { remap = false, desc = "WORD Forward" })

-- commands
map('n', 'z', 'u', { remap = false, desc = "undo" })
map('n', 'Z', '<C-r>', { remap = false, desc = "redo" })
map('n', 'r', '.', { remap = false, desc = "repeat last change" })

-- cut, copy, paste, delete
map({ 'n', 'v' }, 'c', '"+y', { remap = false, desc = "Copy (Yank to System Clipboard)" })
map('n', 'cc', '"+yy', { remap = false, desc = "Copy Current Line" })
map({ 'n', 'v' }, 'x', '"+d', { remap = false, desc = "Cut (Delete to System Clipboard)" })
map('n', 'xx', '"+dd', { remap = false, desc = "Cut Current Line" })
map('n', 'v', '"+p', { remap = false, desc = "Paste from System Clipboard" })
map('x', 'v', '"_d"+P', { remap = false, desc = "Paste Over Selection (Preserve Clipboard)" })
map({ 'n', 'v' }, 'd', '"_d', { remap = false, desc = "Pure Delete (Black Hole)" })
map('n', 'dd', '"_dd', { remap = false, desc = "Pure Delete Current Line" })

-- directional insert modes
map('n', 'J', 'i', { remap = false }) -- Insert Left
map('n', 'L', 'a', { remap = false }) -- Insert Right
map('n', 'I', 'O', { remap = false }) -- Insert Up (new line above)
map('n', 'K', 'o', { remap = false }) -- Insert Down (new line below)
map('n', '<S-m>', '^i', { remap = false, desc = "Insert at start of line" })
map('n', '>', 'A', { remap = false, desc = "Insert at end of line" })

-- select (visual mode)
map('n', 's', 'v', { remap = false, desc = "Visual Select (Character)" })
map('n', 'S', 'V', { remap = false, desc = "Visual Select (Line)" })
map('n', '<C-s>', '<C-v>', { remap = false, desc = "Visual Select (Block)" })

-- Backspace (change operator)
map({ 'n', 'v' }, '<BS>', '"_c', { remap = false, desc = "Delete & Insert" })
map('n', '<BS><BS>', '"_cc', { remap = false, desc = "Delete Entire Line & Insert" })
map('n', '<S-BS>', '"_c$', { remap = false, desc = "Delete to End of Line & Insert" })

-- text objects
map({ 'o', 'x' }, 'w', 'i', { remap = false, desc = "Within (Inside)" })
map({ 'o', 'x' }, 'e', 'a', { remap = false, desc = "Entire (Around)" })

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
-- NEOGIT KEYMAPS
-- ===================================================================
map("n", "<leader>gg", function()
  require("neogit").open()
end, { desc = "Neogit Status" })

map("n", "<leader>gs", "<cmd>Neotree float git_status<CR>", {
  desc = "Git Status Float (HEAD)",
})

map("n", "<leader>gb", "<cmd>Neotree float git_status git_base=main<CR>", {
  desc = "Git Status Float (vs main)",
})

-- ===================================================================
-- TELESCOPE KEYMAPS
-- ===================================================================
map("n", "<leader>f", function()
  local builtin = require("telescope.builtin")
  builtin.find_files({
    cwd = vim.fn.getcwd(),
    hidden = true,
  })
end, { desc = "Telescope Find Files (CWD)" })

-- ===================================================================
-- SEARCH AND REPLACE
-- ===================================================================
map('n', '<leader>rw', function()
  local cword = vim.fn.expand('<cword>')
  if cword == "" then return end
  local cmd = ":%s/\\<" .. cword .. "\\>//gc"
  local keys = vim.api.nvim_replace_termcodes(cmd .. "<Left><Left><Left>", true, false, true)
  vim.api.nvim_feedkeys(keys, 'n', false)
end, { remap = false, desc = "Replace word under cursor (current file)" })
map('n', '<leader>r/', ':%s//gc<Left><Left><Left>', {
  remap = false,
  desc = "Search and replace prompt (current file)",
})

map('v', '<leader>r', '"hy:%s/<C-r>h//gc<Left><Left><Left>', {
  remap = false,
  desc = "Replace selection (current file)",
})

-- ===================================================================
-- ctrl commands
-- ===================================================================
map('n', '<C-a>', 'ggVG', { desc = 'Select All' })
map('n', '<C-w>', '<cmd>w<CR>', { remap = false, desc = "Save File" })
map('i', '<C-w>', '<cmd>w<CR>', { remap = false, desc = "Save File" })
map('v', '<C-w>', '<cmd>w<CR>', { remap = false, desc = "Save File" })
map('n', '<C-q>', '<cmd>q<CR>', { remap = false, desc = "Quit Current Window" })

-- ===================================================================
-- WINDOW KEYMAPS
-- ===================================================================
-- Window Creation & Splits
map('n', '<leader>wv', '<cmd>vsplit<CR>', { remap = false, desc = "Split Window Vertically" })
map('n', '<leader>wh', '<cmd>split<CR>', { remap = false, desc = "Split Window Horizontally" })
map('n', '<leader>wc', '<cmd>close<CR>', { remap = false, desc = "Close Current Window" })
map('n', '<leader>wo', '<cmd>only<CR>', { remap = false, desc = "Close All Other Windows" })
-- Directional Focus Switching (using ijkl)
map('n', '<leader>wi', '<C-w>k', { remap = false, desc = "Focus Window Up" })
map('n', '<leader>wk', '<C-w>j', { remap = false, desc = "Focus Window Down" })
map('n', '<leader>wj', '<C-w>h', { remap = false, desc = "Focus Window Left" })
map('n', '<leader>wl', '<C-w>l', { remap = false, desc = "Focus Window Right" })

-- ===================================================================
-- MISC KEYMAPS
-- ===================================================================
