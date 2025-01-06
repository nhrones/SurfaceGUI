
import { 
   ctx, 
   signals,
} from '../mod.js'

/** 
 *  Plain-text rendering class 
 *  - accepts an ElementDescriptor 
 */
export default class TextElem {

   id = 0 // N/A
   activeView = false
   enabled = false
   hovered = false
   focused = false
   path = new Path2D()
   index = 0
   zOrder = 0   // assigned by activeViews.add()
   tabOrder = 0 // N/A
   name
   size
   textSize
   location
   textLocation
   padding = 10
   strokeColor = "black"
   fillColor
   fontColor
   fontSize
   text
   lastText
   hasBorder = false
   fill = true
   textAlign
   textBaseline
   TextLocation
   boundingBox = { left: 0, top: 0, width: 0, height: 0 }

   /**
    * ctor that instantiates a new virtual Text view
    * @param {{ kind?: string; idx: any; tabOrder?: number; id: any; text: any; location: any; size: any; fontSize?: any; bind: any; color?: any; fontColor?: any; padding?: any; textAlign?: any; textBaseline?: any; TextLocation?: any; fill?: any; hasBoarder?: any; }} el
   */
   constructor(el) {
      this.name = el.id
      this.index = el.idx
      this.text = el.text ?? ''
      this.lastText = ''
      this.size = el.size ?? { width: 30, height: 30 }
      this.textSize = { width: this.size.width, height: this.size.height }
      this.location = el.location
      this.boundingBox = { 
         left: this.location.left, 
         top: this.location.top, 
         width: this.size.width, 
         height: this.size.height 
      }
      this.fillColor = el.color ??  "transparent"
      this.fontColor = el.fontColor || 'black'
      this.fontSize = el.fontSize || 18
      this.padding = el.padding || 10
      this.textAlign = el.textAlign || "center"
      this.textBaseline = el.textBaseline ?? "middle"
      this.TextLocation = el.TextLocation ?? "middle"
      this.textLocation = { left: el.location.left, top: el.location.top }
      this.fill = el.fill ?? true
      this.hasBorder = el.hasBoarder ?? false
      this.calculateMetrics()
 
      // should this static text `bind` to update signals?
      if (el.bind) {

         signals.on('UpdateText', this.name,
            (/** @type {{ border: boolean; fill: boolean; fillColor: any; fontColor: any; text: string; }} */ data) => {
               this.calculateMetrics()
               this.hasBorder = data.border
               this.fill = data.fill
               this.fillColor = data.fillColor
               this.fontColor = data.fontColor
               this.lastText = data.text
               this.text = data.text
               this.update()
            }
         )
      }
   }

   /** 
    * updates and renders this view 
    * called from a host (Button host or main-VM) 
    */
   update() {
      this.calculateMetrics()
   }

   /** 
    * render this Text-View onto the canvas 
    */
   render() {
      if(!ctx) return
      ctx.save()
      ctx.font = `${this.fontSize}px Tahoma, Verdana, sans-serif`;
      ctx.textAlign = this.textAlign
      ctx.textBaseline = this.textBaseline
      if (this.fill === true) {
         ctx.fillStyle = this.fillColor
         ctx.fillRect(
            this.location.left, this.location.top,
            this.size.width, this.size.height)
      }
      const bb = this.boundingBox
      if (this.hasBorder === true) {
         ctx.lineWidth = 1
         ctx.strokeStyle = "black"
         ctx.strokeRect(bb.left, bb.top, bb.width, bb.height)
      }
      ctx.fillStyle = this.fontColor
      ctx.fillText(this.text + " ", this.textLocation.left, this.textLocation.top)
      ctx.restore()
   }

   /** not implemented - TextElem are not activeElements */
   touched() { }
 
   /** 
    * calculate location based on font
    */
   calculateMetrics() {
      
      switch (this.TextLocation) {
         case "top":
            this.textLocation.top = this.location.top + this.padding
            break;
            
         case "middle":
            this.textLocation.top = this.location.top + (this.size.height * 0.5)
            break;
            
         default:
               this.textLocation.top = this.location.top + this.padding
               break;
      }
      
      switch (this.textAlign) {
         case "left":
            this.textLocation.left = this.location.left + this.padding
            break;
         case "center":
            this.textLocation.left = this.location.left + (this.size.width * 0.5)
            break;
         case "right":
            this.textLocation.left = this.location.left + this.padding
            break;
         default:
            this.textLocation.left = this.location.left + this.padding
            break;
      }
      this.render()
   }

}
