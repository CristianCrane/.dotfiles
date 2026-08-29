vim.opt.termguicolors = true

local set = vim.api.nvim_set_hl
local text = "#a7b6c5"
local keyword = "#cb7731"

-- background / text color
set(0, "Normal", { bg = "#090909", fg = text })
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
-- neotree
set(0, "NeoTreeDirectoryName", { fg = text })
set(0, "NeoTreeDirectoryIcon", { fg = "#f8d775" })
set(0, "NeoTreeGitAdded", { fg = "#98c379" })
set(0, "NeoTreeGitUntracked", { fg = "#e06c75" })
set(0, "NeoTreeGitModified", { fg = "#82aaff" })
set(0, "NeoTreeGitDeleted", { fg = "#5c6370" })
set(0, "NeoTreeGitIgnored", { fg = "#5c6370" })

-- neogit
set(0, "NeoGitDiffHighlight", { fg = "#ffffff" }) -- Slightly lighter green for more contrast
