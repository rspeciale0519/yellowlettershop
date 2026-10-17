import { strict as assert } from 'assert'
import { describe,it } from 'mocha'
import { shouldRedirectAfterAuthEvent } from '../../lib/auth/sign-in-navigation'
describe('designer auth session restoration',()=>{
 it('keeps the current designer/order when a restored session emits SIGNED_IN first',()=>{
  assert.equal(shouldRedirectAfterAuthEvent({event:'SIGNED_IN',hasSession:true,modalOpen:false,initialLoad:true}),false)
 })
 it('still routes a successful explicit modal login',()=>{
  assert.equal(shouldRedirectAfterAuthEvent({event:'SIGNED_IN',hasSession:true,modalOpen:true}),true)
  assert.equal(shouldRedirectAfterAuthEvent({event:'TOKEN_REFRESHED',hasSession:true,modalOpen:true}),false)
  assert.equal(shouldRedirectAfterAuthEvent({event:'INITIAL_SESSION',hasSession:true,modalOpen:false}),false)
 })
})
