
import { signals } from "../mod.js" 
import { InsertAt } from "../constants.js"

import {
   handleEditEvents,
   removeSelection,
   isBetween,
   insertChars
} from './textUtilities.js'

import { getLines } from './textToLines.js'

/** 
 * Text Editing class   
 * Takes a 1-to-1 reference to a View id   
 * Handles all keyboard signals for this id    
 * Edits a text string based on keys touched    
 * Fires targeted signals to update a View  
 */
export class TextEditor {

   /** an identity string shared with a View  */
   id = '';

   //================================
   //       TextArea Metrics
   // passed in via TextMetrics event
   //================================

   /** the number of chars each line can show */
   textCapacity = 0;

   /** the number of rows this view can show */
   rowCapacity = 0;

   /** size of the View container (pixels) */
   containerSize = { width: 0, height: 0 };

   //================================
   //   strings
   //================================

   /** the current full text */
   fullText = "";

   /** fullText as an array of lines that fit the viewport */
   lines = []

   //================================
   //   flags
   //================================

   /** does the client View have the focus? */
   focused = false;

   /** are we currently selecting text?  */
   selecting = false;

   //================================
   // pointers
   //================================

   insertionColumn = 0;
   insertionRow = 0;
   insertionIndex = 0;
   selectStart = 0;
   selectEnd = 0;

   /** 
    * LiveText constructor
    */
   constructor(id, text = '') { 

      // set any initial text
      this.fullText = text

      // host VM sets the identity of this instance 
      this.id = id

      // a View or a VM will report its TextMetrics on initialization
      signals.on('TextMetrics', this.id, (data) => {
         this.containerSize = data.size;
         this.textCapacity = data.capacity.columns - 1;
         this.rowCapacity = data.capacity.rows;
         this.refreshLines(InsertAt.TxtEnd)
      })

      // listen for a touch event
      signals.on('TextViewTouched', this.id, () => {
         // update the view
         this.updateText(this.id, true, "TextViewTouched")
      })

      // listen for a focus change event
      signals.on('Focused', this.id, (hasFocus) => {
         // have liveText update the view (sets liveText focus state)
         this.updateText(this.id, hasFocus, "Focused");
      })

      // Input eventhandler -> data: string
      signals.on(`WindowInput`, this.id, (evt) => {
         insertChars(this, evt.data)
      })

      // KeyDown eventhandler for: enter, backspace, delete, arrows, shiftKey, ctrlKey  
      signals.on('WindowKeyDown', this.id, (evt) => { // OK
         const { ctrlKey, shiftKey } = evt
         // a `ctrlKey` implies an edit command 
         // trap and handle the edit commands 
         if (ctrlKey) {

            // handle Cut, Copy, Paste commands  
            handleEditEvents(this, evt)

            // after handling an edit, just bail
            return
         }

         // even though the framework discriminates who 
         // has focus, we'll assert it on keyboard signals  
         this.focused = true
         // which key was pressed 152 - 350
         switch (evt.code) {
            
            // remove a character left
            case "Backspace": // OK
            
               //ndh why both???
               if (this.insertionColumn > 0 && this.insertionIndex > 0) {
                  //fix if has a PLACEHOLDER')
                  this.selectStart = this.insertionIndex - 1 
                  this.selectEnd = this.insertionIndex
                  removeSelection(this) //mutation
                  this.resetSelectionState()
               }
               // go up a row
               else {
                  if (this.insertionRow > 0) {
                     this.insertionRow -= 1
                     this.insertionColumn = this.lines[this.insertionRow].length
                     this.refreshLines()
                  }
                  this.selectStart = this.insertionIndex - 1 
                  this.selectEnd = this.insertionIndex
                  removeSelection(this) //mutation
                  this.resetSelectionState()
               }
               break;

            // if we have a selection delete it
            // else, delete one character to the right of the insertionColumn    
            case "Delete": { // OK
               // if -> selection delete it and adjust insertion point
               if (this.hasSelection() && shiftKey) {
                  removeSelection(this) //mutation
                  this.resetSelectionState()
               }
               // no selection - just delete one char right 
               else {
                  // if not at the end
                  if (this.insertionIndex < this.fullText.length) {
                     this.selectStart = this.insertionIndex
                     this.selectEnd = this.insertionIndex + 1
                     removeSelection(this) //mutation
                     this.resetSelectionState()
                  }
               }
               break;
            }

            // move down in view or select up
            case "ArrowDown": // OK
               if (this.hasText() === true) {
                  if (this.insertionRow < this.lines.length - 1) {
                     this.insertionRow += 1
                  }
                  if (shiftKey) {
                     if (!this.selecting) {
                        this.selectStart = this.insertionIndex;
                        this.selecting = true;
                     }
                     this.insertionColumn = this.lines[this.insertionRow].length
                     this.selectEnd = this.fullText.length;
                  } else {

                     this.resetSelectionState()
                  }
               }
               // update Insertion
               this.updateInsertionPoint("DwnArrow")
               break;

            case "End":  // OK
               if (shiftKey) {
                  if (!this.selecting) {
                     this.selectStart = this.insertionIndex;
                     this.selecting = true;
                  }
                  this.selectEnd = this.lines[this.insertionRow].end;
               } else {
                  this.insertionColumn = this.lines[this.insertionRow].length
                  // update the view
                  this.resetSelectionState()
               }
               this.updateInsertionPoint(`Home Shift = ${shiftKey}`)
               break;

            // the enter key will create -> move to a new line 
            case "Enter": // OK
               insertChars(this, '\n')
               break;

            case "Home": // OK
               if (shiftKey) {
                  if (!this.selecting) {
                     this.selectEnd = this.insertionIndex;
                     this.selecting = true;
                  }
                  this.selectStart = this.lines[this.insertionRow].start;
               } else {
                  this.insertionColumn = 0
                  this.resetSelectionState()
               }
               // update the view             
               this.updateInsertionPoint(`Home Shift = ${shiftKey}`)
               break;

            // paste from clipboard
            case "Insert":
               // paste from clipboard at insertion point
               if (shiftKey) {
                  insertChars(this)
                  this.refreshLines()
               }
               break;

            // move left in viewport or select left
            case "ArrowLeft": // OK
               if (this.insertionIndex > 0) {
                  this.insertionColumn -= 1
                  if (this.insertionColumn < 0) {
                     this.insertionRow -= 1
                     if (this.insertionRow < 0) this.insertionRow = 0
                     this.insertionColumn = this.lines[this.insertionRow].length
                  }
                  // LeftArrow-selecting?
                  if (shiftKey) {
                     if (!this.selecting) {
                        this.selectEnd = this.insertionIndex + 1;
                        this.selecting = true;
                     }
                     this.selectStart = this.insertionIndex - 1;
                  }
                  // LeftArrow not selecting - undo any selection
                  else {
                     this.resetSelectionState()
                  }
                  this.updateInsertionPoint(`LeftArrow Shift = ${shiftKey}`)
               }
               break;

            // move right or select right   
            case "ArrowRight": { // OK
               // At the end of fullText?
               if (this.insertionIndex < this.fullText.length) {
                  this.insertionColumn += 1
                  if (this.insertionColumn > this.lines[this.insertionRow].length) {
                     this.insertionRow += 1
                     if (this.insertionRow > this.lines.length) {
                        this.insertionRow = this.lines.length
                     } else {
                        this.insertionColumn = 0
                     }
                  }
                  if (shiftKey) {
                     // going right
                     if (this.insertionIndex < (this.lines[this.insertionRow].end)) {
                        if (!this.selecting) {
                           this.selectStart = this.insertionIndex;
                           this.selecting = true;
                        }
                        this.selectEnd = this.insertionIndex + 1;
                     }
                  }
                  // normal RightArrow - undo any selection
                  else {
                     this.resetSelectionState()
                  }
               }
               this.updateInsertionPoint(`RightArrow Shift = ${shiftKey}`)
               break;
            }

            // move up a row or select up
            case "ArrowUp": // OK
               if (this.hasText() === true) {
                  // not at the top row
                  if (this.insertionRow > 0) {
                     // decrement row
                     this.insertionRow -= 1;
                     if (shiftKey) {
                        if (!this.selecting) {
                           this.selectEnd = this.insertionIndex;
                           this.selecting = true;
                        }
                        this.insertionColumn = 0
                        this.selectStart = 0;
                     } else {

                        this.resetSelectionState()
                     }
                  }
               }
               // update Insertion
               this.updateInsertionPoint('UpArrow')
               break;

            default:
               break;
         }
      })
   }

   /** resets selecting flag and start/end locations */
   resetSelectionState() { // OK
      this.selecting = false;
      this.selectEnd = 0;
      this.selectStart = 0;
      for (const line of this.lines) {
         line.hasSelection = false
      }
   }

   /**  fullText length > 0  */
   hasText() { // OK
      return this.fullText.length > 0
   }

   /** 
    * Create a new array of lines after any fullText mutation
    * Adjusts insertion point if line count was changed 
    */
   refreshLines(at = InsertAt.Calc) { // OK
      const originalLineCnt = this.lines.length
      this.lines = getLines(this.fullText, this.containerSize.width - 5)
      // did we just add a new line?  
      if (this.lines.length > originalLineCnt) {
         this.insertionRow += 1
      } 
      else if (this.lines.length < originalLineCnt) {
         if (this.insertionRow > this.lines.length -1 ) {
            this.insertionRow = this.lines.length -1
            if (this.insertionRow < 0) this.insertionRow = 0
         }
      }
      this.updateInsertionPoint("refreshLines", at)
   }

   /**
    * update the insertion column and row from insertion index
    * @param {string} from
    */
   updateInsertionPoint(from, insertAt = InsertAt.Calc) {
      switch (insertAt) {

         // calculate and set index from row and column 
         case InsertAt.Calc: {
            for (const line of this.lines) {
               // sets line.hasSelection
               this.testForSelection(line)
               // recalculate insertionIndex
               if (this.insertionRow === line.index) {
                  // clamp the column
                  if (this.insertionColumn > line.length) {
                     this.insertionColumn = line.length
                  }
                  this.insertionIndex = line.start + this.insertionColumn
               }
            }
            break;
         }

         case InsertAt.TxtStart:
            this.insertionRow = 0
            this.insertionColumn = 0
            this.insertionIndex = 0
            break;

         case InsertAt.TxtEnd:
            this.insertionIndex = this.fullText.length
            this.insertionRow = this.lastLineIndex();
            this.insertionColumn = this.lines[this.insertionRow].length
            break;

         default:
            break;
      }

      this.updateText(this.id, true, from)
   }

   /** fullText has selection */
   hasSelection() { // OK
      return (this.selectEnd - this.selectStart > 0)
   }

   /**
    * this line has selection
    * @param {{ hasSelection?: any; start?: any; end?: any; }} line
    */
   testForSelection(line) {
      if (!this.hasSelection()) {
         line.hasSelection = false
         return
      }
      const { start, end } = line
      if (isBetween(this.selectStart, start, end)) {
         line.hasSelection = true
         return
      }

      if (isBetween(this.selectEnd, start, end)) {
         line.hasSelection = true
         return
      }
   }

   /** get the index of our last line */
   lastLineIndex() { // OK
      return this.lines.length - 1
   }

   /**
    * Fire an event to update the host view
    * @param {string} id
    * @param {boolean} hasfocus
    * @param {string} reason
    */
   updateText(id, hasfocus, reason) { // OK
      this.focused = hasfocus
      signals.fire('UpdateTextArea', id,
         {
            reason: reason,
            text: this.fullText,
            lines: this.lines,
            focused: this.focused,
            insertionColumn: this.insertionColumn,
            insertionRow: this.insertionRow,
            selectStart: this.selectStart,
            selectEnd: this.selectEnd,
         })
   }
}
