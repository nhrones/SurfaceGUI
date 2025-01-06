
/** 
 * Named Signals    
 * Each signal \<name\> is unique    
 * Each signal registers a payload (type) 
 * This payload is type-checked when coding event-handlers     
 * or when firing signals
 */
export const BaseSignals = {
   
   /*======= System Signals =======*/

   /** a caret blink signal */
   Blink: true,

   /** Focused state-changed signal */
   Focused: false,

   /** View was added signal */
   AddedView: {
      type: "",
      index: 0,
      name: ""
   },

   /** Delete Row */
   DeleteRow: {index: 0},
   
   /** hide \<Popup\> command signal */
   HidePopup: null,
   
   /** PopupReset */
   PopupReset: null,
   
   /** \<Popup\> view focus command signal */
   FocusPopup: null,
   
   /** Show \<Popup\> view signal */
   ShowPopup: {
      title: "",
      msg: []
   },
   
   /** Window Input signal */
   WindowInput: InputEvent,

   /** Window KeyDown signal */
   WindowKeyDown: KeyboardEvent,
     
   /*======= Base Events =======*/
   
   /** \<Button\> view touched signal */
   ButtonTouched: null,
   
   /** CheckBox Touched */
   CheckBoxTouched: { checked: false },

   /** Text Metrics update signal */
   TextMetrics: {
      size: {width: 0, height: 0},
      capacity: {
         rows: 0,
         columns: 0
      }
   },

   /** Update \<Text\> view touched signal */
   TextViewTouched: null,

   /** Update \<Button\> view signal */
   UpdateButton: {
      text: "",
      color: "",
      enabled: false
   },

   /** Update \<CheckBox\> view signal */
   UpdateCheckBox: {
      text: "",
      color: "",
      checked: false
   },
   
   UpdateLabel: {
      state: 0,
      color: "",
      textColor: "",
      text: ""
   },
   
   /** update a \<TextArea\> view signal */
   UpdateTextArea: {
      reason: "",
      text: "",
      lines: [],
      focused: false,
      insertionColumn: 0,
      insertionRow: 0,
      selectStart: 0,
      selectEnd: 0,
   },

   /** update a \<TextBox\> view signal */
   UpdateTextBox: {
      viewport: "",
      viewportStart: 0,
      focused: false,
      insertionColumn: 0,
      selectStart: 0,
      selectEnd: 0,
   },

   /** update static \<Text\> view signal */
   UpdateText: {
      border: false,
      fill: false,
      fillColor: "",
      fontColor: "",
      text: ""
   },
   
   /** mouse Scroll signal */
   Scroll: { deltaY: 0 }
};