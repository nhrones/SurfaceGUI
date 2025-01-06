import { signals } from '../mod.js'

// used to recognize signals from a (decoupled) view
let thisID;

/**  
 * To be called by a main viewmodel
 * @param {string} id - a unique identifier name
 */
export const initCloseButton = (id) => {    
    thisID = id   
    // listens for a touch event from this buttom 
    signals.on('ButtonTouched', thisID, () => {
        console.log("window.close");
        self.close()
    })
}