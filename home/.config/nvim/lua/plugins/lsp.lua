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
        'typescript',
        'typescriptreact',
      },
      root_markers = { 'tsconfig.json', 'package.json', 'jsconfig.json', '.git' },
      capabilities = capabilities,
      settings = {
        typescript = {
          suggest = {
            completeFunctionCalls = true,
            autoImports = true,
          },
          preferences = {
            includePackageJsonAutoImports = "on",
            includeCompletionsForModuleExports = true,
            includeCompletionsForImportStatements = true,
            allowSyntheticDefaultImports = true,
            preferTypeOnlyAutoImports = true,
          },
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

    -- lua_ls Configuration
    vim.lsp.config('lua_ls', {
      cmd = { 'lua-language-server' },
      filetypes = { 'lua' },
      root_markers = {
        '.luarc.json',
        '.luarc.jsonc',
        '.stylua.toml',
        'stylua.toml'
      },
      capabilities = capabilities,
      settings = {
        Lua = {
          diagnostics = {
            globals = { 'vim' } -- whats this
          },
          workspace = {
            library = vim.api.nvim_get_runtime_file("", true),
            checkThirdParty = false,
          },
          telemetry = { enable = false },
        },
      },
    })
    vim.lsp.enable('lua_ls')
  end,
}
