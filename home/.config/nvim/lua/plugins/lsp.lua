return {
  "neovim/nvim-lspconfig",
  config = function()
    vim.lsp.config('vtsls', {
      cmd = { 'vtsls', '--stdio' },
      filetypes = {
        'javascript',
        'javascriptreact',
        'javascript.jsx',
        'typescript',
        'typescriptreact',
        'typescript.tsx',
      },
      root_markers = { 'tsconfig.json', 'package.json', 'jsconfig.json', '.git' },
    })

    vim.lsp.enable('vtsls')
  end,
}
