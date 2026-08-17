return {
  {
    "xiantang/darcula-dark.nvim",
    dependencies = {
      "nvim-treesitter/nvim-treesitter",
    },
    config = function()
      require("darcula").setup({})
      vim.cmd.colorscheme("darcula-dark")
    end,
  },
  {
    'folke/which-key.nvim',
    lazy = false,
    config = true -- popup that shows what my leader keys do
  },
}
