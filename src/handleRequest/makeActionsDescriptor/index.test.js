const makeActionsDescriptor = require('./index.js')

describe('makeActionsDescriptor()', () => {
  it('exports a placeholder returning null', () => {
    expect(makeActionsDescriptor()).toBe(null)
  })
})
