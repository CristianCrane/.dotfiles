local map = vim.keymap.set

-- ===================================================================
-- COMMAND PROMPT (/)
-- ===================================================================
map({ "n", "v" }, "/", ":", { noremap = true, desc = "Command prompt" })

-- ===================================================================
-- BASE MOVEMENT (i, j, k, l)
-- ===================================================================
map({ 'n', 'v', 'o' }, 'j', 'h', { remap = false })
map({ 'n', 'v', 'o' }, 'i', 'k', { remap = false })
map({ 'n', 'v', 'o' }, 'k', 'j', { remap = false })
map({ 'n', 'v', 'o' }, 'l', 'l', { remap = false })
map({ 'n', 'v', 'o' }, 'm', '^', { remap = false, desc = "Line Home (first character)" })
map({ 'n', 'v', 'o' }, '.', '$', { remap = false, desc = "Line End" })

-- ===================================================================
-- WORD MOVEMENT (u, o)
-- ===================================================================
map({ 'n', 'v', 'o' }, 'u', 'b', { remap = false, desc = "word Back" })
map({ 'n', 'v', 'o' }, 'U', 'B', { remap = false, desc = "WORD Back" })
map({ 'n', 'v', 'o' }, 'o', 'w', { remap = false, desc = "word Forward" })
map({ 'n', 'v', 'o' }, 'O', 'W', { remap = false, desc = "WORD Forward" })

-- ===================================================================
-- UNDO (z), REDO (Z), COPY (c), PASTE (p), DELETE (d)
-- ===================================================================
map('n', 'z', 'u', { remap = false, desc = "Undo" })
map('n', 'Z', '<C-r>', { remap = false, desc = "Redo" })
map({ 'n', 'v' }, 'c', '"+y', { remap = false, desc = "Copy" })
map('n', 'cc', '"+yy', { remap = false, desc = "Copy Current Line" })
map({ 'n', 'v' }, 'x', '"+d', { remap = false, desc = "Cut" })
map('n', 'xx', '"+dd', { remap = false, desc = "Cut Current Line" })
map('n', 'v', '"+p', { remap = false, desc = "Paste" })
map('x', 'v', '"_d"+P', { remap = false, desc = "Paste Over Selection" })
map({ 'n', 'v' }, 'd', '"_d', { remap = false, desc = "Delete" })
map('n', 'dd', '"_dd', { remap = false, desc = "Delete Current Line" })

-- ===================================================================
-- INSERT MODES (shift+i, shift+j, shift+k, shift+l)
-- ===================================================================
map('n', 'J', 'i', { remap = false, desc = "Insert (left)" })
map('n', 'L', 'a', { remap = false, desc = "Insert (right)" })
map('n', 'I', 'O', { remap = false, desc = "Insert (new line above)" })
map('n', 'K', 'o', { remap = false, desc = "Insert (new line below)" })
map('n', '<S-m>', '^i', { remap = false, desc = "Insert (start of line)" })
map('n', '>', 'A', { remap = false, desc = "Insert (end of line)" })

-- ===================================================================
-- SELECT OPERATOR (s)
-- ===================================================================
map('n', 's', 'v', { remap = false, desc = "Select (Character)" })
map('n', 'S', 'V', { remap = false, desc = "Select (Line)" })
map('n', '<C-s>', '<C-v>', { remap = false, desc = "Select (Block)" })

-- ===================================================================
-- CHANGE OPERATOR (r)
-- ===================================================================
map({ 'n', 'v' }, 'r', '"_c', { remap = false, desc = "Delete & Insert (Change)" })
map('n', 'rr', '"_cc', { remap = false, desc = "Delete Entire Line & Insert" })
map('n', '<S-r>', '"_c$', { remap = false, desc = "Delete to End of Line & Insert" })

-- ===================================================================
-- TEXT OBJECTS (w) and (e)
-- ===================================================================
map({ 'o', 'x' }, 'w', 'i', { remap = false, desc = "Within (Inside)" })
map({ 'o', 'x' }, 'e', 'a', { remap = false, desc = "Entire (Around)" })

-- ===================================================================
-- CODE ACTION KEYMAPS
-- ===================================================================
map({ "n", "v" }, "<leader>ca", vim.lsp.buf.code_action, { desc = "Code Action" })

map("n", "<leader>co", function()
  vim.lsp.buf.code_action({
    apply = true,
    context = {
      only = { "source.organizeImports" },
      diagnostics = {},
    },
  })
end, { desc = "Organize Imports" })

map("n", "<leader>cf", function()
  require("conform").format({
    async = true,
    lsp_fallback = true,
  })
end, { desc = "Format current file" })

-- ===================================================================
-- ERROR NAVIGATION
-- ===================================================================
map("n", "]e", function()
  vim.diagnostic.jump({ count = 1, severity = vim.diagnostic.severity.ERROR, float = { focusable = true, autofocus = true } })
end, { desc = "Next Error" })

map("n", "[e", function()
  vim.diagnostic.jump({ count = -1, severity = vim.diagnostic.severity.ERROR, float = { focusable = true, autofocus = true } })
end, { desc = "Previous Error" })

-- ===================================================================
-- GIT (<leader>g)
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
-- SEARCH (<leader>s)
-- ===================================================================
map("n", "<leader>sf", function()
  local builtin = require("telescope.builtin")
  builtin.find_files({
    cwd = vim.fn.getcwd(),
    hidden = true,
  })
end, { desc = "Search files (current working dir)" })

map('n', '<leader>st', require('telescope.builtin').live_grep, { desc = "Search text (current working dir)" })

-- ===================================================================
-- CTRL COMMANDS
-- ===================================================================
map('n', '<C-a>', 'ggVG', { desc = 'Select All' })
map('n', '<C-q>', '<cmd>q<CR>', { remap = false, desc = "Quit Current Window" })
map({ "n", "v" }, "<C-f>", "/", { noremap = true, desc = "Search forward in buffer" })
map('n', '<C-r>', function()
  local cword = vim.fn.expand('<cword>')
  local cmd = ":%s/\\<" .. cword .. "\\>//gc"
  local keys = vim.api.nvim_replace_termcodes(cmd .. "<Left><Left><Left>", true, false, true)
  vim.api.nvim_feedkeys(keys, 'n', false)
end, { remap = false, desc = "Replace" })

map('v', '<C-r>', '"hy:%s/<C-r>h//gc<Left><Left><Left>', {
  remap = false,
  desc = "Replace selection",
})


-- ===================================================================
-- WINDOW KEYMAPS
-- ===================================================================
-- Window Creation & Splits
map('n', '<leader>wc', '<cmd>close<CR>', { remap = false, desc = "Close Current Window" })
map('n', '<leader>wo', '<cmd>only<CR>', { remap = false, desc = "Close All Other Windows" })
-- Normal Mode: <Tab> cycles forward through open windows/UI splits
map("n", "<Tab>", "<C-w>w", { desc = "Focus next window/UI" })
-- Normal Mode: <Shift-Tab> cycles backward through open windows/UI splits
map("n", "<S-Tab>", "<C-w>W", { desc = "Focus previous window/UI" })

-- ===================================================================
-- TERMINAL KEYMAPS
-- ===================================================================
map("n", "<C-t>", function()
  local pane_id = os.getenv("WEZTERM_PANE")

  -- Get directory of the currently active buffer file
  local current_file_dir = vim.fn.expand("%:p:h")

  -- Fallback to workspace root if no buffer/file is open
  if current_file_dir == "" then
    current_file_dir = vim.fn.getcwd()
  end

  if pane_id then
    vim.fn.system(
      string.format(
        "wezterm.exe cli split-pane --pane-id %s --bottom --percent 30 --cwd %s",
        pane_id,
        vim.fn.shellescape(current_file_dir)
      )
    )
  else
    vim.fn.system(
      string.format(
        "wezterm.exe cli split-pane --bottom --percent 30 --cwd %s",
        vim.fn.shellescape(current_file_dir)
      )
    )
  end
end, { desc = "Open Terminal in current directory" })
