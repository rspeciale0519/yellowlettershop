/** Restoring a session must preserve the page the customer opened. */
export function shouldRedirectAfterAuthEvent(state:{event:string;hasSession:boolean;modalOpen:boolean;initialLoad?:boolean}):boolean{return state.event==='SIGNED_IN' && state.hasSession && state.modalOpen}
