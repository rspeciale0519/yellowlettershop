import { describe, it } from "mocha"
import { strict as assert } from "assert"
import { buildInviteToken } from "../../lib/teams/invite-token"

describe("buildInviteToken", () => {
  it("produces a 43+ char url-safe token", () => {
    assert.match(buildInviteToken(), /^[A-Za-z0-9_-]{43,}$/)
  })

  it("is unique across calls", () => {
    assert.notEqual(buildInviteToken(), buildInviteToken())
  })
})
