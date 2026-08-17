vim.opt.termguicolors = true

local set = vim.api.nvim_set_hl
local text = "#a7b6c5"
local keyword = "#cb7731"

-- background / text color
set(0, "Normal", { bg = "#2b2b2b", fg = text })
set(0, "Keyword", { fg = keyword })
set(0, "Identifier", { fg = text })
set(0, "DiagnosticUnderlineError", { fg = "#b33e3b" })
set(0, "String", { fg = "#698253" })
set(0, "Comment", { fg = "#808080" })
set(0, "Delimiter", { fg = text })
set(0, "Special", { fg = keyword }) 
set(0, "Type", { fg = text })
set(0, "Operator", { fg = text })
set(0, "Function", { fg = "#ffc66d" })
set(0, "@variable", { fg = text })
set(0, "PreProc", { fg = "#b3b428" })
set(0, "Constant", { fg = "#4f8dba" })
set(0, "@variable.member.typescript", { fg = "#8f75a9" })
