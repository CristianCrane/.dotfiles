-- Fetch blink.cmp's LSP capabilities
local capabilities = require('blink.cmp').get_lsp_capabilities()

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
      capabilities = capabilities,
      settings = {
        typescript = {
          inlayHints = {
            parameterNames = { enabled = 'all' },
            parameterTypes = { enabled = true },
            variableTypes = { enabled = true },
            propertyDeclarationTypes = { enabled = true },
            functionLikeReturnTypes = { enabled = true },
          },
        },
      },
    })

    vim.lsp.enable('vtsls')
  end,
}
