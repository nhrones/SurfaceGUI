
/** 
 * We use this factory function to create a new SignalAggregator service.      
 * You can use intersection types for the generic type:     
 * @example buildSignalAggregator<CoreEvents & LocalEvents>()
 */
export const signals = buildSignalAggregator()

/** 
 * A factory function that returns a generic strongly-typed SignalAggregator instance 
 * @typeParam T - type that extends EventContract\<T\>
 * @returns SignalAggregator<T> - a strongly-typed SignalAggregator object with the following two methods:   
 * @method on - registers a callback function to be called when the named signal is fired. 
 * @method fire - fires (emmits) the signal, triggering the execution of registered callbacks. 
 */
export function buildSignalAggregator() {

   /** 
    * holds an array of eventhandler for each registered signal name 
    */
   const eventHandlers = new Map()

   const newSignalAggregator = {

      /** 
       * on - registers a handler function to be executed when a signal is sent
       *  
       * @param {*} signalName - signal name (one of `TypedEvents` only)!
       * @param {string} id - id of a target element (may be an empty string)
       * @param {*} handler - eventhandler callback function
       */
      on (
         signalName,
         id,
         handler
      ) {
         // create a keyName that combines the signalName and the target element id (if any)
         const keyName = signalName + '-' + id

         // if this keyName has already been registered
         if (eventHandlers.has(keyName)) {
            const handlers = eventHandlers.get(keyName)
            // push this new handler to it. 
            handlers.push(handler)
         } else {  // keyName has yet to be registered
            // when first seen - create it with this handler
            eventHandlers.set(keyName, [handler])
         }

      },

      /** 
       * Execute all registered handlers for a strongly-typed signal (signalName)
       * @param {*} signalName - signal name - one of `TypedEvents` only!
       * @param {string} id - id of a target element (may be an empty string)
       * @param {*} data - data payload, typed for this category of signal
       */
      fire (
         signalName,
         id,
         data
      ) {
         // create a keyName that combines the signalName and the target element id (if any)
         const keyName = signalName + '-' + id

         // check for any registered handlers for this unique keyName
         const handlers = eventHandlers.get(keyName);
         if (handlers) {
            // callback all registered handlers with any data payload
            for (const handler of handlers) {
               // call it!
               handler(data)
            }
         }
      }
      
   }
   return newSignalAggregator
}
