
/// <reference lib="dom" />
import { ctx } from '../mod.js'
import ScrollableContainer from './Container.js'

/** 
 * A ScrollBar class
 */
export default class Scrollbar {

   container
   mousePos = 0
   dragging = false
   hovered = false
   visible = true
   left = 0
   top = 0
   width = 0
   height = 0
   fill

   cursor;

   path

   /**
    * Scrollbar ctor
    * @param {*} host
    */
   constructor(host) {
      this.container = host
      this.left = (host.left + host.width) - host.scrollBarWidth,
         this.top = host.top
      this.height = host.height,
         this.width = host.scrollBarWidth
      this.fill = '#dedede';

      this.cursor = {
         index: 0,
         top: 0,
         bottom: host.height - host.scrollBarWidth,
         left: this.left + this.width - host.scrollBarWidth,
         width: host.scrollBarWidth,
         length: host.scrollBarWidth,
         fill: '#bababa'
      };

      this.path = new Path2D()  //this.buildPath()
      this.path.rect(
         this.left, this.top,
         this.width - 2, this.height
      )

      /** last known mouse location */
      this.mousePos = 0;

   }

   /**
    * called from - container.js - 97
    * @param {number} ItemsLength
    * @param {number} capacity
    */
   render(ItemsLength, capacity) {

      const ratio = capacity / ItemsLength
      this.cursor.length = 100 //hack this.height * ratio

      ctx.save()

      //fill the scrollbar
      ctx.fillStyle = this.fill;
      ctx.fill(this.path)

      //fill cursor
      ctx.fillStyle = 'red'; //hack this.cursor.fill;
      ctx.fillRect(
         this.cursor.left,
         this.container.top + this.cursor.top,
         this.cursor.width,
         this.cursor.length
      );

      // scrollbar outline
      ctx.lineWidth = 2
      ctx.strokeStyle = (this.hovered) ? 'orange' : '#bababa';
      ctx.stroke(this.path)

      ctx.restore()
   }

   /**
    * called by the scroll event - container.js - 63
    * @param {number} delta
    */
   scroll(delta) {

      const { height, lineHeight, rowCapacity, top } = this.container

      this.cursor.index -= delta
      if (this.cursor.index < 0) this.cursor.index = 0
      //if ((this.cursor.index + 20) > rowCapacity) this.cursor.index = rowCapacity - 20

      // 180px / 30-lines remaining = 6px per index
      // remember cursor.top is zero based
      const newTop = (this.cursor.index * lineHeight);
      if (newTop + this.cursor.length >= height + top) {
         // ??
      } else {
         this.cursor.top = newTop
      }

      if (this.cursor.top < 0) this.cursor.top = 0;

      //const ratio = this.cursor.length / height;
      //this.cursor.top = (this.cursor.top * ratio);
      this.container.render()
   }

} // class end


/**
 * @param {number} num
 */
function toInt(num) {
   return num | 0;
}