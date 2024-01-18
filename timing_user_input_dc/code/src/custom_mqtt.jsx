export async function custom_new_message_action(dispatch, message) {
  console.log(message)
  console.log('*** custom_new_message_action ***')
}

export const CustomReducer = (currentState, action) => {
  // console.log(action)
  switch (action.type) {
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