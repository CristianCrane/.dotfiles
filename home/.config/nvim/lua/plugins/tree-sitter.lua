return {
  'nvim-treesitter/nvim-treesitter',
  lazy = false,
  build = ':TSUpdate',
  init = function()
    vim.api.nvim_create_autocmd("FileType", {
      pattern = {
        "typescript",
        "typescriptreact",
        "javascript",
        "javascriptreact",
        "lua",
        "vim",
        "vimdoc",
      },
      callback = function(args)
        pcall(vim.treesitter.start, args.buf)
      end,
    })
  end,
  config = function()
    require('nvim-treesitter').install({ "typescript", "tsx", "javascript", "lua", "vim", "vimdoc" })
  end,
}

