local augroup = vim.api.nvim_create_augroup
local autocmd = vim.api.nvim_create_autocmd

local save_and_format_group = augroup("AutoSaveAndFormat", { clear = true })

autocmd({ "InsertLeave", "FocusLost", "BufLeave" }, {
  group = save_and_format_group,
  callback = function(args)
    local buf = args.buf

    -- Only run on normal, modified, editable files
    if not vim.api.nvim_buf_is_valid(buf)
        or vim.bo[buf].buftype ~= ""
        or vim.bo[buf].readonly
        or not vim.bo[buf].modified then
      return
    end

    -- 1. Format synchronously first
    local ok, conform = pcall(require, "conform")
    if ok then
      conform.format({
        bufnr = buf,
        async = false, -- Synchronous format ensures disk write includes formatted code
        lsp_format = "fallback",
      })
    end

    -- 2. Save buffer immediately after formatting
    vim.api.nvim_buf_call(buf, function()
      vim.cmd("silent! write")
    end)
  end,
})
