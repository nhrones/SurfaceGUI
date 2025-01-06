
import { signals } from '../mod.js'

// used to recognize signals from a (decoupled) view
let thisID;

/**  
 * To be called by a main viewmodel
 * @param {string} id - a unique identifier name
 */
export const initButton = (id) => {
   thisID = id
   // listens for a touch event from a Button view with the same id 
   signals.on('ButtonTouched', thisID, () => {
      // fire an event to show a popup
      signals.fire('ShowPopup', '', { title: "", msg: [""] })
   })
}