
import Container from './Container.js'

import {
   ctx,
   signals
} from '../mod.js'

import {
   HAIRSPACE,
   CARETBAR,
} from  '../viewModels/constants.js'

const dev = false

let caretChar = HAIRSPACE
const placeholder = 'text'

/** TextArea class */
export default class TextArea extends Container {
   id = 0
   activeView = true
   index = 1
   zOrder = 0
   tabOrder = 0
   name = ''
   enabled = true
   hovered = false
   focused = false
   log = false
   path
   size
   padding = 10
   location
   color
   fontColor
   lineHeight = 0
   text = ""
   lines = []
   trimmedLeft = ""
   trimmedRight = ''
   insertionColumn = 0
   insertionRow = 0
   selectStart = 0;
   selectEnd = 0;
   widthPerChar = 15
   solidCaret = true

   /** 
    * the number of characters that will fit in this width  
    */
   textCapacity = 0
   rowCapacity = 0
   showPlaceholder = true
   fontSize


   /**
    * @param {{ id: any; tabOrder: any; location: any; size: any; color: any; fontSize?: any; }} el
    */
   constructor(el) {

      super(el)
      
      this.name = el.id
      this.tabOrder = el.tabOrder || 0
      this.location = el.location
      this.size = el.size || { width: 100, height: 40 }
      this.color = el.color || 'white'
      this.fontColor = 'black'
      this.fontSize = el.fontSize || 28
      // calculates the fit
      // the number of characters this View could hold 
      this.getMetrics()
      this.path = new Path2D
      this.path.rect(
         this.location.left,
         this.location.top,
         this.size.width,
         this.size.height
      )

      // report the metrics to any interested party
      signals.fire('TextMetrics', this.name,
         {
            size: this.size,
            capacity: { rows: this.rowCapacity, columns: this.textCapacity }
         }
      )

      signals.on("Blink", "", (/** @type {boolean} */ data) => {
         this.solidCaret = data
         this.render()
         console.log('Blink')
      })

      // the VM will emit this event whenever it needs to update the View            
      signals.on('UpdateTextArea', this.name, 
      (/** @type {{ _reason: any; text: any; lines: any; focused: any; insertionColumn: any; insertionRow: any; selectStart: any; selectEnd: any; }} */ data) => {
         const {
            _reason,
            text,
            lines,
            focused,
            insertionColumn,
            insertionRow,
            selectStart,
            selectEnd,
         } = data

         this.insertionColumn = insertionColumn
         this.insertionRow = insertionRow
         this.selectStart = selectStart
         this.selectEnd = selectEnd

         this.focused = focused

         this.lines = lines
         this.text = text
         this.showPlaceholder = (this.text.length === 0)
         // are we focused?
         if (this.focused === true) {
            caretChar = CARETBAR
         }

         let str = ""
         for (const line of this.lines) {
            str += `${JSON.stringify(line)}
            `
         }

         const A = true
         if (A) console.log(` 
         focused: ${this.focused} insertionRow: ${this.insertionRow} 
         highlighted text: ${text.substring(this.selectStart, this.selectEnd)}
         selection -- start: ${this.selectStart}, end: ${this.selectEnd} 
         insertion -- row: ${this.insertionRow}, column: ${this.insertionColumn}
         ${str}`, "TextArea.UpdateTextArea")
         this.render()
      })

      this.render() // initial render

   }

   getMetrics() {
      // calculates fit based on font
      ctx.font = `${this.fontSize}px Tahoma, Verdana, sans-serif`;
      const t = 'This is a test! A very very long text!'
      const m = ctx.measureText(t)
      this.lineHeight = (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent);
      // deno-lint-ignore no-self-assign
      this.size.height = this.size.height
      this.widthPerChar = m.width / t.length
      this.textCapacity = this.size.width / this.widthPerChar
   }

   getUnusedSpace() {
      return this.size.width - ctx.measureText(this.text).width;
   }

   touched() {
      signals.fire('TextViewTouched', this.name, null)
   }

   update() {
      this.render()
   }

   /** render the container and text */
   render() {

      /** render the container and scrollbar */
      super.render()

      ctx.textAlign = 'left'
      ctx.textBaseline = "alphabetic"

      ctx.save()

      // blink the caret
      if (this.focused === true) {
         caretChar = CARETBAR//hack (this.solidCaret)? HAIRSPACE : CARETBAR
      } else {
         caretChar = ''
      }

      let lineNumber = 0

      // for each line draw text
      for (const line of this.lines) {

         // be sure we have some text to render
         if (line.length <= 0) continue;

         // get top of each line
         const textTop = this.location.top + ((this.lineHeight * (lineNumber + 1)))

         // not focused (no caret)
         if (this.showPlaceholder && this.focused === false) {
            ctx.fillStyle = 'Gray'
            ctx.fillText(
               placeholder,
               this.location.left + this.padding,
               textTop
            )
         }
         // is focused -- add caret + highlight
         else {
            let txt = ""
            // track and move the curser location 
            this.positionCaret(line.text)

            // render the highlight
            if (line.hasSelection) this.renderHighlight(line);

            // add the caret to the appropriate row
            txt = (this.insertionRow === lineNumber)
               ? this.trimmedLeft + caretChar + this.trimmedRight
               : line.text

            ctx.fillStyle = this.fontColor
            ctx.fillText(txt,
               this.location.left + this.padding,
               textTop
            )
         }
         ctx.restore()
         lineNumber++
      }
   }

   /**
    * locate Caret
    * @param {string} line
    */
   positionCaret(line) {
      const col = this.insertionColumn
      // set caret location
      this.trimmedLeft = line.substring(0, col);
      this.trimmedRight = line.substring(col);
   }

   /**
    * Highlight selected text
    * @param {{ start: number; end: number; index: any; }} line
    */
   renderHighlight(line) {

      // unpack this instance object (for brevity)
      const { lineHeight, padding, location, selectStart, selectEnd, text } = this

      //======================================================
      // Use textMetrix to calculate our highlight area
      //======================================================

      // First, get the width (pixels) of any unselected 
      // chars at the beginning (start of highlight).
      const rectX = (selectStart <= line.start)
         ? 0
         : ctx.measureText(text.substring(line.start, selectStart)).width

      // Next, get the width (pixels) of all selected chars (end of highlight).
      const endFrom = (selectStart > line.start) ? selectStart : line.start
      const endTo = (selectEnd >= line.end) ? line.end : selectEnd
      const rectWidth = ctx.measureText(text.substring(endFrom, endTo)).width

      // Finally, get the measurement for the top of the highlight rectangle
      const rectY = location.top + (lineHeight * (line.index)) + padding

      // if (dev) {
      //    console.log(`hiStart ${rectX}, hiEnd ${rectWidth}, hiTop ${rectY}`)
      //    console.log(`selectStart ${selectStart}, selectEnd ${selectEnd}`)
      //    console.log(`lineStart ${line.start}, lineEnd ${line.end}`)
      // }

      ctx.fillStyle = 'lightblue'
      ctx.fillRect(
         location.left + padding + rectX,
         rectY,
         rectWidth,
         lineHeight
      )
   }

}