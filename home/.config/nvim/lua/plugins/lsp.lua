return {
  "neovim/nvim-lspconfig",
  event = { "BufReadPre", "BufNewFile" },
  config = function()
    vim.lsp.config('vtsls', {
      cmd = { 'vtsls', '--stdio' },
      filetypes = {
        'javascript',
        'javascriptreact',
        'javascript',
        'typescript',
        'typescriptreact',
        'typescript',
      },
      root_markers = { 'tsconfig.json', 'package.json', 'jsconfig.json', '.git' },
    })

    vim.lsp.enable('vtsls')
  end,
}
