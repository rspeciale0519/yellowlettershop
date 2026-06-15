import { describe, it } from "mocha"
import { strict as assert } from "assert"
import { inviteEmailHtml } from "../../lib/email/invite-template"

describe("inviteEmailHtml", () => {
  it("includes the signup link with the token for the invited path", () => {
    const html = inviteEmailHtml({ mode: "invited", token: "abc123", appUrl: "http://localhost:3010" })
    assert.ok(html.includes("http://localhost:3010/signup?invite=abc123"))
  })

  it("omits the signup link for an added existing user", () => {
    const html = inviteEmailHtml({ mode: "added", appUrl: "http://localhost:3010" })
    assert.ok(!html.includes("/signup?invite="))
  })
})
