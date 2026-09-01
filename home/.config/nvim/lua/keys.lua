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
map('n', 'a', 'ggVG', { desc = 'Select All' })
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
-- INSERT MODE (enter, shift+enter)
-- ===================================================================
local function is_editable_buffer()
  return vim.bo.buftype == "" and vim.bo.filetype ~= "qf"
end

map("n", "<CR>", function()
  if is_editable_buffer() then
    return "a"
  end
  return "<CR>"
end, { expr = true, desc = "Enter Insert mode" })

map("n", "<S-CR>", function()
  if is_editable_buffer() then
    return "o"
  end
  return "<S-CR>"
end, { expr = true, desc = "Open line below and enter Insert mode" })

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
-- CODE ACTIONS
-- ===================================================================
map("n", "q", "<cmd>Lspsaga hover_doc<CR>", { desc = "Show LSP hover documentation" })
map({ "n", "v" }, "<leader>ca", "<cmd>Lspsaga code_action<CR>", { desc = "Code Action" })
map("n", "<leader>cf", function()
  require("conform").format({
    async = true,
    lsp_fallback = true,
  })
end, { desc = "Format current file" })
map("n", "]e", function()
  require("lspsaga.diagnostic"):goto_next({
    severity = vim.diagnostic.severity.ERROR,
  })
end, { desc = "Next Error" })
map("n", "[e", function()
  require("lspsaga.diagnostic"):goto_prev({
    severity = vim.diagnostic.severity.ERROR,
  })
end, { desc = "Previous Error" })
map("n", "<leader>cd", "<cmd>Lspsaga show_line_diagnostics<CR>", { desc = "Show Line Diagnostics" })

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
-- FIND (<leader>f)
-- ===================================================================
map("n", "<leader>ff", function()
  local builtin = require("telescope.builtin")
  builtin.find_files({
    cwd = vim.fn.getcwd(),
    hidden = true,
  })
end, { desc = "Find file (current working dir)" })

map('n', '<leader>ft', require('telescope.builtin').live_grep, { desc = "Find text (current working dir)" })

map('n', '<leader>fc', function()
  local builtin = require("telescope.builtin")
  builtin.find_files({
    prompt_title = ".dotfiles",
    hidden = true,
    cwd = vim.fn.expand("~/.dotfiles"),
  })
end, { desc = "Find config (.dotfiles)" })

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
-- TAB KEYMAPS
-- ===================================================================
map("n", "<C-t>", "<cmd>tabnew<CR>", { noremap = true, desc = "New tab" })
map("n", "<C-Tab>", "<cmd>tabnext<CR>", { noremap = true, desc = "Next tab" })
map("n", "<C-S-Tab>", "<cmd>tabprevious<CR>", { noremap = true, desc = "Previous tab" })

-- ===================================================================
-- WINDOW KEYMAPS
-- ===================================================================
map('n', '<leader>wc', '<cmd>close<CR>', { remap = false, desc = "Close Current Window" })
map('n', '<leader>wo', '<cmd>only<CR>', { remap = false, desc = "Close All Other Windows" })
map("n", "<Tab>", "<C-w>w", { desc = "Focus next window/UI" })
map("n", "<S-Tab>", "<C-w>W", { desc = "Focus previous window/UI" })

-- ===================================================================
-- TERMINAL KEYMAPS
-- ===================================================================
map({ "n", "t" }, "<A-t>", function()
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
