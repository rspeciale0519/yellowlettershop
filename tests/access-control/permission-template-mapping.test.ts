import { describe, it } from "mocha"
import { strict as assert } from "assert"
import {
  expandRules,
  collapsePermissions,
  ALL_RESOURCES,
  type PermissionRule
} from "../../components/access-control/permission-template-mapping"
import type { TemplatePermission } from "../../lib/access-control/time-based-permissions"

describe("permission-template-mapping", () => {
  describe("expandRules", () => {
    it("expands a multi-target rule to one entry per id, sharing level + duration", () => {
      const rules: PermissionRule[] = [
        { resource_type: "mailing_list", targets: ["a", "b", "c"], permission_level: "view_only", duration_days: 30 }
      ]
      const out = expandRules(rules)
      assert.equal(out.length, 3)
      assert.deepEqual(out.map(e => e.resource_id), ["a", "b", "c"])
      assert.ok(out.every(e => e.resource_type === "mailing_list" && e.permission_level === "view_only" && e.duration_days === 30))
    })

    it("stores 'All' as a single wildcard entry", () => {
      const out = expandRules([
        { resource_type: "design", targets: [ALL_RESOURCES], permission_level: "edit", duration_days: null }
      ])
      assert.equal(out.length, 1)
      assert.equal(out[0].resource_id, "*")
      assert.equal("duration_days" in out[0], false) // permanent => omitted
    })

    it("collapses a wildcard mixed with ids down to the wildcard only", () => {
      const out = expandRules([
        { resource_type: "asset", targets: ["x", ALL_RESOURCES], permission_level: "admin" }
      ])
      assert.deepEqual(out.map(e => e.resource_id), ["*"])
    })

    it("drops empty targets", () => {
      assert.deepEqual(expandRules([
        { resource_type: "asset", targets: [], permission_level: "view_only" }
      ]), [])
    })
  })

  describe("collapsePermissions", () => {
    it("groups entries sharing type+level+duration into one rule", () => {
      const perms: TemplatePermission[] = [
        { resource_type: "mailing_list", resource_id: "a", permission_level: "view_only", duration_days: 30 },
        { resource_type: "mailing_list", resource_id: "b", permission_level: "view_only", duration_days: 30 }
      ]
      const rules = collapsePermissions(perms)
      assert.equal(rules.length, 1)
      assert.deepEqual(rules[0].targets, ["a", "b"])
    })

    it("keeps differing duration/level in separate rules", () => {
      const perms: TemplatePermission[] = [
        { resource_type: "mailing_list", resource_id: "a", permission_level: "view_only", duration_days: 30 },
        { resource_type: "mailing_list", resource_id: "b", permission_level: "edit", duration_days: 30 },
        { resource_type: "mailing_list", resource_id: "c", permission_level: "view_only", duration_days: 7 }
      ]
      assert.equal(collapsePermissions(perms).length, 3)
    })

    it("a wildcard entry becomes an All rule", () => {
      const rules = collapsePermissions([
        { resource_type: "design", resource_id: "*", permission_level: "edit" }
      ])
      assert.equal(rules.length, 1)
      assert.deepEqual(rules[0].targets, [ALL_RESOURCES])
    })
  })

  describe("round-trip", () => {
    it("expand(collapse(perms)) preserves the stored entries", () => {
      const perms: TemplatePermission[] = [
        { resource_type: "mailing_list", resource_id: "a", permission_level: "view_only", duration_days: 30 },
        { resource_type: "mailing_list", resource_id: "b", permission_level: "view_only", duration_days: 30 },
        { resource_type: "design", resource_id: "*", permission_level: "edit" },
        { resource_type: "contact_card", resource_id: "c", permission_level: "admin", duration_days: 90 }
      ]
      const round = expandRules(collapsePermissions(perms))
      const norm = (xs: TemplatePermission[]) =>
        xs.map(e => `${e.resource_type}|${e.resource_id}|${e.permission_level}|${e.duration_days ?? "perm"}`).sort()
      assert.deepEqual(norm(round), norm(perms))
    })
  })
})
