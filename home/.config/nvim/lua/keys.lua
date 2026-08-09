-- save by pressing escape
vim.keymap.set('n', '<Esc>', ':w<CR>', { desc = 'Save' })

-- select all
vim.keymap.set('n', '<C-a>', 'ggVG', { desc = 'Select All' })

-- pasting over a selection no longer clobbers clipboard
vim.cmd([[ xnoremap <expr> p 'pgv"'.v:register.'y' ]])
