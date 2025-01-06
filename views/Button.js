
import {
   ctx,
   signals
} from "../mod.js"

import TextElem from './TextElem.js'

/** 
 * A virtual Button-View class 
 */
export default class Button {

   id = 0
   activeView = true
   index = -1
   zOrder = 0
   tabOrder = 0
   name = ''
   enabled = true
   hovered = false
   focused = false
   path
   size
   location
   color
   fontColor
   textNode
   boarderWidth
   text = ""

   /**
    * instantiate a new vitual Button-View
    * @param {{ id: string; tabOrder: number; location: any; boarderWidth: number; size: { width: number; height: number; }; radius: any; text: string; fontSize: any; color: string; fontColor: string; }} el
    */
   constructor(el) {
      this.name = el.id
      this.zOrder = 0
      this.tabOrder = el.tabOrder || 0
      this.location = el.location
      this.boarderWidth = el.boarderWidth || 1
      this.size = el.size || { width: 50, height: 30 }
      this.enabled = true
      this.path = this.buildPath(el.radius || 10)
      this.textNode = new TextElem(
         {
            kind: 'TextElem',
            idx: -1,
            tabOrder: 0,
            id: this.name + 'Label',
            text: el.text || "",
            location: {left: this.location.left +10, top: this.location.top + 10},
            size: { width: this.size.width-20, height: this.size.height-20 }, //this.size,
            fontSize: el.fontSize || 18,
            bind: true
         }
      )
      this.color = el.color || 'red'
      this.fontColor = el.fontColor || 'white'
      this.text = el.text || "??"
      this.render()

      //================================================
      //                bind signals
      //================================================

      // a VM will emit this event whenever it needs to update the view
      signals.on('UpdateButton', this.name,
         (/** @type {{ enabled: boolean; color: string; text: string; }} */ data) => {
            this.enabled = data.enabled
            this.color = data.color
            this.text = data.text
            this.update()
         })
   }

   /**
    * build the Path2D
    * @param {number} radius
    */
   buildPath(radius) {
      const path = new Path2D
      path.roundRect(
         this.location.left, this.location.top,
         this.size.width, this.size.height,
         radius
      )
      return path
   }

   /** 
    * called from core/systemEvents when this element is touched
    * fires an event on the eventBus to inform VMs 
    */
   touched() {
      if (this.enabled) {
         signals.fire('ButtonTouched', this.name, null)
      }
   }

   /** 
    * updates and renders this view 
    * called from /core/systemEvents (hover test) 
    */
   update() {
      this.render()
   }

   /** 
    * render this Button view onto the canvas 
    */
   render() {
      ctx.save()
      ctx.lineWidth = this.boarderWidth
      ctx.strokeStyle = (this.hovered) ? 'orange' : 'black'
      ctx.stroke(this.path)
      ctx.fillStyle = this.color
      ctx.fill(this.path)
      ctx.fillStyle = 'white'
      ctx.restore()
      this.textNode.fillColor = this.color
      this.textNode.fontColor = this.fontColor
      this.textNode.text = this.text
      this.textNode.update()
   }
}