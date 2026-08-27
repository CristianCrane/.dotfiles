return {
  "nvim-telescope/telescope.nvim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    -- Native C sorter for super fast fuzzy searching (requires make)
    { "nvim-telescope/telescope-fzf-native.nvim", build = "make" },
  },
  config = function()
    local telescope = require("telescope")

    telescope.setup({
      defaults = {
        path_display = { "smart" },
        mappings = {
          i = {
            ["<C-k>"] = require("telescope.actions").move_selection_next,
            ["<C-i>"] = require("telescope.actions").move_selection_previous,
          },
        },
      },
    })

    -- Load fzf extension if installed
    pcall(telescope.load_extension, "fzf")
  end,
}
