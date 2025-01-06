/// <reference lib="dom" />
import {   
   ctx, 
   signals
} from '../mod.js'

/** 
 * A virtual CheckBox-View class 
 */
export default class CheckBox {

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
   boarderWidth
   fontSize
   text = ""
   checked = false
   
   /**
    * instantiate a new vitual CheckBox-View
    * @param {{ id: string; tabOrder: number; location: { left: any; top: any; }; boarderWidth: number; size: { width: number; height: number; }; radius: any; color: string; fontColor: string; text: string; fontSize: number; }} el
    */
   constructor(el) {
      this.name = el.id
      this.zOrder = 0
      this.tabOrder = el.tabOrder || 0
      this.location = el.location
      const { left, top } = el.location
      this.boarderWidth = el.boarderWidth || 1
      this.size = el.size || { width: 50, height: 30 }
      const { width, height } = this.size
      this.enabled = true
      this.path = this.buildPath(el.radius || 0)
      this.color = el.color || 'red'
      this.fontColor = el.fontColor ||'white'
      this.text = el.text || "??"
      this.fontSize = el.fontSize || 24
      this.render()

      //================================================
      //                bind signals
      //================================================

      // a VM will emit this event whenever it needs to update the view
      signals.on('UpdateCheckBox', this.name,
         (/** @type {{ checked: boolean; color: string; text: string; }} */ data) => {
            this.checked = data.checked
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
         signals.fire('CheckBoxTouched', this.name, { checked: this.enabled })
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
      ctx.lineWidth = 8;
      ctx.strokeStyle = (this.hovered) ? 'orange' : 'black'
      ctx.stroke(this.path)
      ctx.fillStyle = this.color
      ctx.fill(this.path)
      ctx.fillStyle = 'white'
      ctx.restore()

      ctx.save()
      ctx.font = `${this.fontSize}px Tahoma, Verdana, sans-serif`;
      ctx
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "limegreen"
      ctx.fillRect( this.location.left, this.location.top, this.size.width, this.size.height)
      ctx.fillStyle = this.fontColor
      const top = this.location.top + (this.size.height * 0.5)
      const left = this.location.left + (this.size.width * 0.5)
      ctx.fillText(this.text + " ", left, top)
      ctx.restore()
   }
}