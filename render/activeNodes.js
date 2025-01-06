
import { ctx, incrementTickCount } from './renderContext.js'
import { signals } from '../signals/signals.js'

//===============================  activeNodes  ======================================
//       
//  activeNodes ... a collection of 'UI' View objects. 
//  activeNode objects are used to manage and render virtual UI to the 'canvas'. 
//                                                                                 
//  activeNodes are held in an ES6 Set. 
//  The Set insertion order insures proper rendering, as well as, ordered 
//  hit-testing. Hit-testing uses each nodes Path2D member. 
//                                                       
//  We hit-test 'front-to-back' to insure that top-level nodes are detected first.                                                   \\
//                                                                               
//=====================================================================================

/** 
 * the set of all active nodes 
 */ 
export const activeNodes = new Set()

/** 
 * adds a new UI node (View), to the activeNodes collections 
 */
export const addNode = (view) => {

   // add all activeView-nodes to our activeNodes collection
   activeNodes.add(view)
   
   // inform any interested parties that a new View UI was added
   signals.fire('AddedView', "",
      {
         type: view.constructor.name,
         index: view.index,
         name: view.name
      }
   )
}


/** 
 * main render function - called from /host/uiContainer
 * Only called on app startup and on app reset. 
 */
export const renderNodes = () => {

   // see renderContext.js
   // used to render our blinking caret for text edit nodes
   incrementTickCount()

   // insure we have a canvas context ready
   if (ctx) {
      const { width, height } = ctx.canvas
      ctx.save()
      // refresh the surface
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'snow'
      ctx.fillRect(0, 0, width, height)
      
      // render a boarder
      ctx.lineWidth = 2
      ctx.strokeStyle = "black"
      ctx.strokeRect(0, 0, width, height)
      ctx.restore()

      // render all views
      for (const el of activeNodes) {
         el.update()       
      }
   }
}
