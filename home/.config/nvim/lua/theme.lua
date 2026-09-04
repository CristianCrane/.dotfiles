vim.opt.termguicolors = true

local set = vim.api.nvim_set_hl
local text = "#a7b6c5"
local keyword = "#cb7731"

-- backgrounds
set(0, "Normal", { bg = "#0f0f0f", fg = text })
set(0, "NormalNC", { bg = "#090909", fg = text })
set(0, "WinSeparator", { bg = "bg", fg = "bg" })

set(0, "EndOfBuffer", { fg = "bg" })
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
set(0, "@lsp.type.property", { link = "@variable.member.typescript" })
set(0, "TabLine", { fg = "#7f849c", bg = "#181825" })
set(0, "TabLineSel", { fg = "#cdd6f4", bg = "#313244", bold = true })
set(0, "@lsp.type.typeParameter.typescript", { fg = "#497072" })
-- neotree
set(0, "NeoTreeDirectoryName", { fg = text })
set(0, "NeoTreeDirectoryIcon", { fg = "#f8d775" })
set(0, "NeoTreeGitAdded", { fg = "#98c379" })
set(0, "NeoTreeGitUntracked", { fg = "#e06c75" })
set(0, "NeoTreeGitModified", { fg = "#82aaff" })
set(0, "NeoTreeGitDeleted", { fg = "#5c6370" })
set(0, "NeoTreeGitIgnored", { fg = "#5c6370" })

-- diagnostic floats
set(0, "DiagnosticFloatingError", { fg = "#e06c75", bg = "#2c191e" })
set(0, "DiagnosticFloatingWarn", { fg = "#e5c07b", bg = "#2a241a" })
set(0, "DiagnosticFloatingInfo", { fg = "#61afef", bg = "#1b2738" })
set(0, "DiagnosticFloatingHint", { fg = "#5c6370", bg = "#1b1d23" })
