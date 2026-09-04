return {
  "jake-stewart/multicursor.nvim",
  branch = "1.0",
  config = function()
    local mc = require("multicursor-nvim")
    mc.setup()

    local set = vim.keymap.set

    -- Add or skip cursor above/below (custom layout: i = Up, k = Down)
    set({ "n", "x" }, "<S-i>", function() mc.lineAddCursor(-1) end, { desc = "Add cursor above" })
    set({ "n", "x" }, "<S-k>", function() mc.lineAddCursor(1) end, { desc = "Add cursor below" })
    set({ "n", "x" }, "<leader><up>", function() mc.lineSkipCursor(-1) end)
    set({ "n", "x" }, "<leader><down>", function() mc.lineSkipCursor(1) end)

    -- Add cursor to next match using Shift+L (custom layout: l = Right/Next)
    set({ "n", "x" }, "<S-l>", function() mc.matchAddCursor(1) end, { desc = "Add cursor to next match" })
    set({ "n", "x" }, "<C-l>", function() mc.matchSkipCursor(1) end)
    set({ "n", "x" }, "<leader>N", function() mc.matchAddCursor(-1) end)
    set({ "n", "x" }, "<leader>S", function() mc.matchSkipCursor(-1) end)

    -- Add and remove cursors with control + left click
    set("n", "<c-leftmouse>", mc.handleMouse)
    set("n", "<c-leftdrag>", mc.handleMouseDrag)
    set("n", "<c-leftrelease>", mc.handleMouseRelease)

    -- Disable and enable cursors
    set({ "n", "x" }, "<c-q>", mc.toggleCursor)

    -- Mappings active only when multiple cursors exist
    mc.addKeymapLayer(function(layerSet)
      -- Select adjacent active cursor (custom layout: j = Left, l = Right)
      layerSet({ "n", "x" }, "j", mc.prevCursor)
      layerSet({ "n", "x" }, "l", mc.nextCursor)

      -- Delete main cursor
      layerSet({ "n", "x" }, "<leader>x", mc.deleteCursor)

      -- Enable and clear cursors using escape
      layerSet("n", "<esc>", function()
        if not mc.cursorsEnabled() then
          mc.enableCursors()
        else
          mc.clearCursors()
        end
      end)
    end)

    -- Highlight overrides
    local hl = vim.api.nvim_set_hl
    hl(0, "MultiCursorCursor", { reverse = true })
    hl(0, "MultiCursorVisual", { link = "Visual" })
    hl(0, "MultiCursorSign", { link = "SignColumn" })
    hl(0, "MultiCursorMatchPreview", { link = "Search" })
    hl(0, "MultiCursorDisabledCursor", { reverse = true })
    hl(0, "MultiCursorDisabledVisual", { link = "Visual" })
    hl(0, "MultiCursorDisabledSign", { link = "SignColumn" })
  end
}
