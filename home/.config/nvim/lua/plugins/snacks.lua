return {
  'folke/snacks.nvim',
  lazy = false,
  opts = {
    picker = { enabled = true },
    notifier = { enabled = true },
    input = { enabled = true },
  },
  keys = {
    { '<leader>s', function() Snacks.picker.grep() end,            desc = 'Search Text' },
    { '<leader>b', function() Snacks.picker.buffers() end,         desc = 'Buffers' },
    { 'gd',        function() Snacks.picker.lsp_definitions() end, desc = 'Goto Definition' },
  },
}
