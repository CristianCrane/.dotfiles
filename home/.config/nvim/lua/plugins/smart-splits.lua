return {
  "mrjones2014/smart-splits.nvim",
  lazy = false,
  opts = {
    -- Automatically set multiplexer title/pane titles if needed
    ignored_events = { "BufEnter", "WinEnter" },
  },
  config = function(_, opts)
    local ss = require("smart-splits")
    ss.setup(opts)

    -- Define directional navigation on Alt + i/j/k/l
    local map = vim.keymap.set

    map({ "n", "t" }, "<A-k>", ss.move_cursor_up, { desc = "Focus pane above" })
    map({ "n", "t" }, "<A-j>", ss.move_cursor_down, { desc = "Focus pane below" })
    map({ "n", "t" }, "<A-i>", ss.move_cursor_up, { desc = "Focus pane above" })
    map({ "n", "t" }, "<A-l>", ss.move_cursor_right, { desc = "Focus pane right" })
  end,
}
