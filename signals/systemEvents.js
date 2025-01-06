
import { activeNodes } from '../render/activeNodes.js'
import { canvas, ctx, hasVisiblePopup } from '../render/renderContext.js'

import { signals } from './signals.js'

//====================================================
//                Sytem Events Module
//  Watch for all host generated events.
//  When appropriate, propagate these host events
//  to our central signalAggregator - events. 
//
//  When an event targets an active node, based on
//  the event type, set the active nodes state to 
//  either hovered, or to focused, and reference 
//  that node as the hoveredNode or the focusedNode. 
//====================================================

const left = 0

// values re-used repeatedly in event handlers
// -- we reuse these to reduce GC pressure
let x = 0
let y = 0
let boundingRect = null
let hit = false
let node = null
let hoveredNode = null
let focusedNode = null

/**
 * Initialize an environment for custom canvas mouse/touch event handlers.
 * 
 * Registers event handlers for:     
 *     InputEvent 
 *     KeyboardEvent
 *     mousedown + touchstart => handleClickOrTouch()    
 *     mousemove => handleMouseMove     
 */
export function initHostEvents() {

   // handle all host `input` events 
   addEventListener("input", (evt) => {
      // look for a focused node, if none, just ignore the event
      if (focusedNode !== null) {
         // we'll fire this event directly to amy focused node
         signals.fire('WindowInput', focusedNode.name, evt)
      }
   })

   // handler for `keydown` -- enter backspace, delete, etc. 
   addEventListener('keydown', (evt) => {
      let focusNum = 0
      // handle Tab key
      if (evt.code === 'Tab') {
         if (focusedNode !== null) {
            const direction = (evt.shiftKey) ? -1 : +1
            focusNum = focusNext(focusedNode.tabOrder + direction, evt.shiftKey)
         } else {
            focusNum = focusNext(1, evt.shiftKey) // focus first
         }
         if (focusNum === 0) { // not found
            const last = (evt.shiftKey) ? 20 : 1
            focusNext(last, evt.shiftKey) // focus first
         }
         return
      }

      // handle Enter key
      if (evt.code === 'Enter') {
         if (hasVisiblePopup === true) {
            signals.fire(`PopupReset`, "", null)
         } else if (focusedNode !== null) {
            focusedNode.touched()
         }
      }

      // look for a currently `focused` node
      if (focusedNode !== null) {
         // we'll signal only the node with focus
         signals.fire('WindowKeyDown', focusedNode.name, evt)
      }
   })

   // register a handler for our canvas mousedown event
   addEventListener('mousedown', (evt) => {
      evt.preventDefault()
      if (evt.button === left) {
         if (hasVisiblePopup === false) {
            // we'll hit-test all activeNodes 
            handleClickOrTouch(evt.pageX, evt.pageY)
         } // a popup was open -> just close it
         else {
            signals.fire(`PopupReset`, "", null)
         }
      }
   }, false)

   // register a handler for our canvas' mousemove event
   addEventListener('mousemove', (evt) => {
      evt.preventDefault()
      // If a popup is open, don't bother with hover testing!
      if (hasVisiblePopup === false) {
         handleMouseMove(evt)
      }
   })

   // we send all scroll events unconditionally 
   // to service any scrollable containers
   addEventListener('scroll', (evt) => {
      evt.preventDefault();
      //TODO fix this
      //const y = (Math.sign(evt.scrollY));
      //signals.fire('Scroll', "", { deltaY: y })
   });

}

//=====================================================
//              custom event handlers 
//=====================================================

/** 
 * Handles canvas mouse-move event.     
 * Provides logic to emulate 'onmouseenter', and        
 * 'onmouseleave' DOM events on our virtual elements.    
 * Uses the canvasContexts 'isPointInPath' method for hit-testing.    
 * @param {MouseEvent} evt - from canvas.mousemove event  
 */
function handleMouseMove(evt) {
   boundingRect = canvas.getBoundingClientRect()
   x = evt.clientX - boundingRect.x
   y = evt.clientY - boundingRect.y

   // test for hovered
   node = null

   for (const n of activeNodes) {
      if (ctx.isPointInPath(n.path, x, y)) {
         node = n
      }
   }

   if (node !== null) {                // did we get a hit? 
      if (node !== hoveredNode) {      // hit was not the current hovered node
         clearHovered()                // clear any prior hover
         node.hovered = true           // set this nodes `hovered` flag
         node.update()                 // command to update the hovered node
         hoveredNode = node            // register this node as currently hovered
         //setCursor("hand")      // change the cursor
         document.documentElement.style.cursor = 'hand';
      }
   } else {                            // no node was hit
      if (hoveredNode !== null) {      // is there a hovered node?
         clearHovered()                // remove hovered state
         hoveredNode = null            // no node currently hover
      }
   }
}

/** 
 * Handler for both, canvas-mouse-Click and canvas-Touch events.    
 * Uses the canvasContexts 'isPointInPath' method for hit-testing. 
 *     
 * If a hit is detected, we directly call the elements touched() method.    
 * When called, the elements `touched()` method will then broadcast 
 * a `touched` event to any registered subscribers.   
 * 
 * @param {number} mX - horizontal location of this event
 * @param {number} mY - vertical location of this event
 */
function handleClickOrTouch(mX, mY) {
   x = mX - canvas.offsetLeft
   y = mY - canvas.offsetTop
   hit = false
   for (const node of activeNodes) {
      if (!hit) { // short circuit once we get a hit
         // check each node (bottom to top), top-most object wins
         if (ctx.isPointInPath(node.path, x, y)) {
            // got one, call the nodes touched method
            node.touched()
            // clear any currently focused view 
            clearFocused()
            // set this as the currently focused node
            focusedNode = node
            // tell others about this newly focused node
            if (focusedNode)
               signals.fire('Focused', focusedNode.name, true);
            hit = true
         }
      }
   }
   // nothing touched - clear the currently focused node
   if (!hit) clearFocused()
}

/** clear last focused object */
function clearFocused() {
   if (focusedNode !== null) {
      focusedNode.focused = false;
      focusedNode.hovered = false
      signals.fire('Focused', focusedNode.name, focusedNode.focused);
      focusedNode.update();      // re-render the node
   }
}

/** clear last hovered object */
function clearHovered() {
   document.documentElement.style.cursor = "arrow"
   if (hoveredNode !== null) {
      hoveredNode.hovered = false
      hoveredNode.update()       // re-render the node
   }
}

/**
 * change focus to this tabOrder
 * @param {number} target
 * @param {boolean} _shift
 */
function focusNext(target, _shift) {
   hit = false
   for (const node of activeNodes) {
      if (hit === false) { // short circuit once we get a hit
         if (node.tabOrder === target) {

            // clear any currently focused view 
            clearFocused()
            clearHovered()

            // set this one as focused
            focusedNode = node
            if (focusedNode) {
               focusedNode.focused = true;
               focusedNode.hovered = true

               // got one, call the nodes update method
               focusedNode.update()

               // tell others about this newly focused node 
               signals.fire('Focused', focusedNode.name, true)
            }
            hit = true
         }
      }
   }
   return (hit === false) ? 0 : target
}
