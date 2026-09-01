return {
  "nvimdev/lspsaga.nvim",
  event = "LspAttach",
  dependencies = {
    "nvim-treesitter/nvim-treesitter",
    "nvim-tree/nvim-web-devicons",
  },
  config = function()
    require("lspsaga").setup({
      hover = {
        max_width = 0.8,
        open_link = "gx",
      },
      lightbulb = {
        enable = false,
      },
      diagnostic = {
        show_code_action = true,
        jump_num_shortcut = true,
      },
    })
  end,
}
