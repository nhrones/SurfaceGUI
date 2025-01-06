
import { PLACEHOLDER } from './constants.js'

//================================================
//                Clipboard 
//================================================
let clipboard = ''
/**
 * @param {string} txt
 */
export function setClipboard(txt) {
   clipboard = txt
}

//================================================
//            text editing Handler 
//================================================
/**
 * text edit event handler
 * @param {*} editor
 * @param {{ code: string; }} evt
 */
export function handleEditEvents(editor, evt) {

   // handle Select-All command
   if (evt.code === 'KeyA') {
      editor.selectStart = 0;
      //fix not selecting fullText
      editor.selectEnd = editor.fullText.length
      for (const line of editor.lines) {
         line.hasSelection = true
      }
      editor.updateText(editor.id, true, "Select-All")

   }

   // handle CUT command  //OK
   if (evt.code === 'KeyX') {

      // may decrement the insertion point
      if (editor.insertionColumn >= editor.selectEnd) {
         editor.insertionColumn = editor.selectStart
      }
      
      // get any selected text
      const selection = getSelectedText(editor)
      
      if (selection.length > 0){
      
         // place any selected text in the clipboard
         setClipboard(selection)
      
         // cut any selected text
         removeSelection(editor)

         editor.refreshLines() // -> updateInsertionPoint -> updateText
      }

   }

   // handle COPY command  // fix leaves wrong insertion row??
   if (evt.code === 'KeyC') {
      // preserve clipboard if no selection
      let selected = getSelectedText(editor)
      // preserve clipboard if no selection
      if (selected.length > 0) {
         // copy selected to clipboard
         setClipboard(selected)
         // remove selection
         editor.selecting = false
         editor.selectEnd = 0
         editor.selectStart = 0
         editor.refreshLines() // -> updateInsertionPoint -> updateText
      }
   }

   // handle PASTE command 
   if (evt.code === 'KeyV') {
      insertChars(editor, clipboard)
   }

}

//================================================
//        text edit utility functions 
//================================================

/**
 * return the current set of selected characters
 * @param {{ selectStart: number; selectEnd: number; fullText: string; }} editor
 */
function getSelectedText(editor) {
   if (editor.selectStart === 0 && editor.selectEnd === 0) return '';
   return editor.fullText.substring(editor.selectStart, editor.selectEnd - 1) //ndh why - 1 ?? 
}


/**
 * remove any selected chars
 * @param {*} editor
 */
export function removeSelection(editor) {
   let left = editor.fullText.substring(0, editor.selectStart)
   let right = editor.fullText.substring(editor.selectEnd)
   editor.fullText = left + right
   editor.refreshLines() // -> updateInsertionPoint -> updateText
}

/**
 * insert the clipboards content at the insertion point
 * @param {*} editor
 */
export function insertChars(editor, chars = clipboard) {

   editor.resetSelectionState()
   // handle a newline char
   if (chars === '\n') {
      // add a placeholder for our caret        
      chars += PLACEHOLDER
      editor.insertionColumn = 0
   } else { // not a newline
      editor.insertionColumn += 1
   }
   if (editor.insertionIndex < editor.fullText.length) {
      let left = editor.fullText.substring(0, editor.insertionIndex)
      let right = editor.fullText.substring(editor.insertionIndex)
      editor.fullText = left + chars + right
      editor.insertionColumn += chars.length - 1 //ndh fix this
   } else {
      editor.fullText += chars
      editor.insertionColumn += chars.length //ndh fix this
   }
   editor.refreshLines() // -> updateInsertionPoint -> updateText
}

// return true if value is in selection range
/**
 * @param {number} point
 * @param {number} start
 * @param {number} end
 */
export function isBetween(point, start, end) {
   return (point >= start && point <= end)
}

