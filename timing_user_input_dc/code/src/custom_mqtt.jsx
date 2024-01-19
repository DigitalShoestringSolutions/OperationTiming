export async function custom_new_message_action(dispatch, message) {
  console.log(message)
  console.log('*** custom_new_message_action ***')
  if (message && message.topic.match("location_state/update")) {
    dispatch({ type: 'ITEM_UPDATE', updated_entry: message.payload })
  } else if (message && message.topic.match("location_state/entered")) {
    dispatch({ type: 'ITEM_ENTERED', added_entry: message.payload })
  } else if (message && message.topic.match("location_state/exited")) {
    dispatch({ type: 'ITEM_EXITED', removed_entry: message.payload })
  }
}


export const CustomReducer = (currentState, action) => {
  console.log("*** CustomReducer ***")
  console.log("Action: ", action)
  console.log("Current State: (1):  ", currentState)
  let filtered_items_state = []
  let new_item_history = []

  switch (action.type) {
    case 'ITEM_ENTERED':
      console.log("Action State: " , action.added_entry.state)
      console.log("Current State.state " , currentState.items_state)
      console.log("Current items from", action.added_entry.state, ": ", currentState.items_state[action.added_entry.state] )
      console.log("Filtered State: " , filtered_items_state)
      
      return {
        ...currentState,
        items_state: {
          ...currentState.items_state,
          [action.added_entry.state]: [...currentState.items_state[action.added_entry.state], action.added_entry]
        }
      }
    case 'ITEM_EXITED':
      // console.log("Action State: " , action.removed_entry.state)
      // console.log("Current State: " , currentState.items_state)
      // console.log("Current items from", action.removed_entry.state, ": ", currentState.items_state[action.removed_entry.state] )
      filtered_items_state = currentState.items_state[action.removed_entry.state].filter(item => !(item.item_id === action.removed_entry.item_id && item.location_link === action.removed_entry.location_link))
      // console.log("Filtered State: " , filtered_items_state)
      return {
        ...currentState,
        items_state: {
          ...currentState.items_state,
          [action.removed_entry.state]: filtered_items_state
        }
      }
    case 'MQTT_STATUS':
      return {
        ...currentState,
        connected: action.connected
      };
    case 'SET_ITEM':
      return {
        ...currentState,
        current_item: action.item
      }
    case 'SET_ITEMS':
      return {
        ...currentState,
        items_state: action.item
      }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

// remove from old list and add to new