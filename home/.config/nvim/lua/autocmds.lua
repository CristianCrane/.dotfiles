local augroup = vim.api.nvim_create_augroup
local autocmd = vim.api.nvim_create_autocmd

local autosave_group = augroup("AutoSaveOnEdit", { clear = true })
autocmd({ "InsertLeave", "FocusLost", "WinLeave" }, {
  group = autosave_group,
  pattern = "*",
  callback = function()
    if vim.bo.modified and vim.bo.buftype == "" and vim.fn.expand("%") ~= "" then
      vim.cmd("write")
    end
  end,
  desc = "Auto-save on edit events",
})
