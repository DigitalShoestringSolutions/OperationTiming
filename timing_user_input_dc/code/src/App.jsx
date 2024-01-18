import 'bootstrap/dist/css/bootstrap.css';
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Container from 'react-bootstrap/Container'
import { MQTTProvider, useMQTTControl, useMQTTDispatch, useMQTTState } from './MQTTContext'
import React from 'react';
import APIBackend from './RestAPI'
import './app.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { custom_new_message_action, CustomReducer } from './custom_mqtt';
import { Form, InputGroup, ListGroup, Nav, Navbar } from 'react-bootstrap';
import { ToastProvider, add_toast, useToastDispatch } from './ToastContext'
import { BrowserRouter, Routes, Route, NavLink, Outlet, useParams } from 'react-router-dom'

function App() {
  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(null)
  let [config, setConfig] = React.useState([])

  React.useEffect(() => {
    let do_load = async () => {
      setPending(true)
      APIBackend.api_get('http://' + document.location.host + '/config/config.json').then((response) => {
        if (response.status === 200) {
          const raw_conf = response.payload;
          console.log("config", raw_conf)
          setConfig(raw_conf)
          setLoaded(true)
        } else {
          console.log("ERROR LOADING CONFIG")
          setError("ERROR: Unable to load configuration!")
        }
      }).catch((err) => {
        console.err(err);
        setError("ERROR: Unable to load configuration!")
      })
    }
    if (!loaded && !pending) {
      do_load()
    }
  }, [loaded, pending])

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading Config</h2></div>}
      </Card>
    </Container>
  } else {
    return (
      <MQTTProvider
        host={config?.mqtt?.host ? config.mqtt.host : document.location.hostname}
        port={config?.mqtt?.port ?? 9001}
        prefix={config?.mqtt?.prefix ?? []}
        subscriptions={[]}
        new_message_action={custom_new_message_action}
        reducer={CustomReducer}
        initial_state={{ current_item: null, items_state: [] }} // May need to modify this 
        debug={true}
      >
        <ToastProvider position='bottom-end'>
          <BrowserRouter>
            <Routing config={config}/>
          </BrowserRouter>
        </ToastProvider>
      </MQTTProvider>
    )
  }
}


function Routing(props) {
  let [location_list, setLocationList] = React.useState([])

  return (
    <Routes>
      <Route path='/' element={<Base location_list={location_list} setLocationList={setLocationList} {...props} />}>
        <Route path='/loc' element={<Dashboard location_list={location_list} config={props.config} />} />
        <Route path='/loc/:location_id' element={<Dashboard location_list={location_list} config={props.config} />} />
        <Route index element={<LocationList location_list={location_list} config={props.config} />}></Route>
      </Route>
    </Routes>
  )
}


function Base({ setLocationList, config }) {
  let [loaded, setLoaded] = React.useState(false)
  let [pending, setPending] = React.useState(false)
  let [error, setError] = React.useState(null)

  React.useEffect(() => {
    let do_load = async () => {
      setPending(true)
      let url = (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
      APIBackend.api_get('http://' + url + '/id/list/' + config.locations.tag).then((response) => {
        if (response.status === 200) {
          setLocationList(response.payload)
          setLoaded(true)
        } else {
          console.error("Unable to load list of locations")
          setError("Unable to load list of locations - please try refresh")
        }
      }).catch((err) => {
        console.err(err);
        setError("ERROR: Unable to load location list!")
      })
    }
    if (!loaded && !pending) {
      do_load()
    }
  }, [loaded, pending, config, setLocationList])

  if (!loaded) {
    return <Container fluid="md">
      <Card className='mt-2 text-center'>
        {error !== null ? <h1>{error}</h1> : <div><Spinner></Spinner> <h2 className='d-inline'>Loading...</h2></div>}
      </Card>
    </Container>
  } else {
    return (
      <Container fluid className="p-0 d-flex flex-column">
        {/* <div id='header'> */}
        <Navbar sticky="top" bg="secondary" variant="dark" expand="md">
          <Container fluid>
            <Navbar.Brand href="/">
              Shoestring Operation Timing
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className='mb-2' />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav variant="pills" className="me-auto">
                <BSNavLink to='/'>Choose Location</BSNavLink>
                <BSNavLink to='/loc'>Scan</BSNavLink>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        {/* </div> */}
        <Container fluid className="flex-grow-1 main-background px-1 pt-2 px-sm-2">
          <Row className="h-100 m-0 d-flex justify-content-center pt-4 pb-5">
            <Col md={10} lg={8}>
              <Outlet />
            </Col>
          </Row>
        </Container>
      </Container>
    )
  }
}

function BSNavLink({ children, className, ...props }) {
  return <NavLink className={({ isActive }) => (isActive ? ("nav-link active " + className) : ("nav-link " + className))} {...props}>{children}</NavLink>
}

function LocationList({ config = {}, location_list }) {
  return <Container fluid="md">
    <Card className='mt-2'>
      <Card.Header className='text-center'><h1>{config?.locations?.title}</h1></Card.Header>
      <Card.Body>
        <ListGroup>
          {location_list.map(item => (
            <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-baseline">
              <NavLink className="mx-2" to={"/loc/" + encodeURIComponent(item.id)}>
                {item.name}
              </NavLink>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  </Container>
}

function Dashboard({ config = {}, location_list}) {
  let params = useParams();
  const current_location_id = params.location_id
  const current_location = location_list.find(elem => elem.id === current_location_id)
  const { sendJsonMessage, subscribe, unsubscribe } = useMQTTControl()




  const barcodeRef = React.useRef(null);
  const toRef = React.useRef(null);
  const fromRef = React.useRef(null);
  const quantityRef = React.useRef(null);
  const submitRef = React.useRef(null);

  let [subscribed, setSubscribed] = React.useState(false)
  let [barcode, setBarcode] = React.useState("")
  let [item_loaded, setItemLoaded] = React.useState(true)
  let [item_pending, setItemPending] = React.useState(false)
  let [item_error, setItemError] = React.useState(undefined)
  let [item_reload, setItemReload] = React.useState(undefined)
  let [items_loaded, setItemsLoaded] = React.useState(false)
  let [items_pending, setItemsPending] = React.useState(false)
  let [items_error, setItemsError] = React.useState(undefined)
  let [items_reload, setItemsReload] = React.useState(undefined)
  let [buttonState, setbuttonState] = React.useState(true)
  let [startOnAddButton, setstartOnAddButton] = React.useState(false)



  let [quantity, setQuantity] = React.useState("")
  let [to, setTo] = React.useState("")
  let [from, setFrom] = React.useState("")


  let toast_dispatch = useToastDispatch()
  let dispatch = useMQTTDispatch()
  let { connected, current_item, items_state } = useMQTTState()
  let variant = "danger"
  let text = "Disconnected"
  if (connected) {
    variant = "success"
    text = "Connected"
  }


  const handle_barcode_submit = (barcode) => {
    console.log("handle_barcode_submit: " + barcode)
    // setItemReload(true);
  }


  React.useEffect(() => {
    if (!subscribed) {
      subscribe("location_state/+/" +  current_location_id)
      setSubscribed(true)
    }
  }, [current_location_id, subscribe, subscribed])

  React.useEffect(() => {
    return () => {
      unsubscribe("location_state/+/" +  current_location_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function getID(prodID){
    // console.log(prodID)
    let url = (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
    // console.log(prodID)
    const response = await APIBackend.api_get('http://' + url + '/id/get/' + config.api.type  +'/' + prodID + "?full")
      if (response.status === 200) {
        console.log("id", response.payload)
        return response.payload
      } else {
        console.log("ERROR LOADING ID")
      }
  }

  React.useEffect(() => {
    if (current_location && to !== current_location.id) {
      setTo(current_location.id)
    }
  }, [current_location, to])

  React.useEffect(() => {
    let do_load = async () => {
      console.log("Loading items")
      setItemsLoaded(false);
      setItemsPending(true);
      setItemsReload(false);
      
      let url = (config.db.host ? config.db.host : window.location.hostname) + (config.db.port ? ":" + config.db.port : "")
      APIBackend.api_get('http://' + url + '/state/at/'+ current_location.id).then(async (response) => {
        if (response.status === 200) {
          const items = {'Active': [], 'Pending': [], 'Complete': []}
          setItemsLoaded(true)
          console.log("items", response.payload)
          for (const item of Object.values(response.payload)) {
            const idObj = await getID(item.item_id);
            console.log("ID Object", idObj)
            Object.assign(item, idObj);
            // console.log(item)
            // console.log(item.state)
            items[item.state].push(item)
          }
          // console.log(items)

          console.log("items", response.payload)
          // dispatch({ type: 'SET_ITEMS', item: response.payload })
          dispatch({ type: 'SET_ITEMS', item: items })

          setItemsError(false)
        } else {
          console.log("ERROR LOADING ITEMS")
          dispatch({ type: 'SET_ITEMS', item: null })
          setItemsError(true)
        }
      }).catch((err) => {
        console.error(err.message);
        setItemsError("ERROR: Unable to load items list!")
      })
    }
    if ((!items_loaded && !items_pending) | items_reload) {
      do_load()
    }
  }, [config.api, config.db, dispatch, items_loaded, items_pending, items_reload])


    

  React.useEffect(() => {
    let do_load = async () => {
      console.log("Loading New Item")
      setItemLoaded(false);
      setItemPending(true);
      setItemReload(false);

      let url = (config.api.host ? config.api.host : window.location.hostname) + (config.api.port ? ":" + config.api.port : "")
      // console.log(url)
      APIBackend.api_get('http://' + url + '/id/get/' + config.api.type + '/' + barcode + "?full").then((response) => {
        if (response.status === 200) {
          console.log("id", response.payload)
          setItemLoaded(true)
          dispatch({ type: 'SET_ITEM', item: response.payload })
          setItemError(false)
        } else {
          console.log("ERROR LOADING ID")
          dispatch({ type: 'SET_ITEM', item: null })
          setItemError(true)
        }
      }).catch(() => (setItemError(true)))
    }
    if ((!item_loaded && !item_pending) | item_reload) {
      do_load()
    }
  }, [barcode, config.api, dispatch, from, item_loaded, item_pending, item_reload])

  React.useEffect(() => {
    if (!barcode) {
      if (barcodeRef?.current)
        barcodeRef.current.focus()
    } else if (!from) {
      if (fromRef?.current)
        fromRef.current.focus()
    } else if (!to) {
      if (toRef?.current)
        toRef.current.focus()
    } else if (current_item?.individual) {
      if (submitRef?.current)
        submitRef.current.focus()
    } else {
      if (quantityRef?.current)
        quantityRef.current.focus()
    }
  }, [barcode, current_item, from, to])

  const handleSubmit = () => {
    const payload = {
      item_id: barcode,
      to: current_location.id,
      message: startOnAddButton ? "Active" : "Pending"
    }
    if (quantity) {
      payload.quantity = Number(quantity)
    }

    const topic = "location_update/" + to 
    try {
      sendJsonMessage(topic, payload);
      add_toast(toast_dispatch, { header: "Sent", body: "" })

      //reset
      setQuantity("");
      // setTo(""); //don't reset to enable quick rescans
      // setFrom("");
      setBarcode("");
      dispatch({ type: 'SET_ITEM', item: null })
      barcodeRef.current.focus()
    } catch (err) {
      console.error(err)
      add_toast(toast_dispatch, { header: "Error", body: err.message })
    }
  }

  const onMessage = (itemId, message) => {
    console.log("item:", itemId, "message:" , message)

    const payload = {
      item_id: itemId,
      to: current_location.id,
      message: message
    }

    const topic = "location_update/" + to 
    try {
      sendJsonMessage(topic, payload);
      add_toast(toast_dispatch, { header: "Sent", body: "" })

      //reset
      // setQuantity("");
      // setTo(""); //don't reset to enable quick rescans
      // setFrom("");
      // setBarcode("");
      // dispatch({ type: 'SET_ITEM', item: null })
      // barcodeRef.current.focus()
    } catch (err) {
      console.error(err)
      add_toast(toast_dispatch, { header: "Error", body: err.message })
    }
  }


  return (

    <>
    <Container fluid className="p-0 d-flex flex-column">
        <Container fluid className="flex-grow-1 px-1 pt-2 px-sm-2">
          <Row className="m-0 mx-2 d-flex justify-content-center pt-2 pb-2">
            <Col>
              {/* <CurrentStatus /> */}
              <Card className='my-2'>
                <Card.Header><h4>{current_location.name}</h4></Card.Header>
                <Card.Body>
                  <BarcodeEntry config={config} barcode={barcode} setBarcode={setBarcode} submit={handle_barcode_submit} barcodeRef={barcodeRef} submitRef={submitRef} handleSubmit={handleSubmit} startOnAddButton={startOnAddButton} setstartOnAddButton={setstartOnAddButton} />
                </Card.Body>
              </Card>


              <Card className='my-2'>
                <Card.Header>
                  <div className="d-flex justify-content-between">
                    <h4>Pending Jobs @ {current_location.name}</h4>
                    <div class="btn-group btn-group-lg" role="group" aria-label="Basic example">
                      <button type="button" class="btn btn-success btn-secondary">Start All</button>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body>
                  {items_state && items_state['Pending'] && items_state['Pending'].map(item => (
                    <Card>
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <Card.Title>{item.name}</Card.Title>
                          <Card.Text>
                            {item.item_id}
                          </Card.Text>
                          <button type="button" class="btn btn-success btn-secondary" onClick={() => onMessage(item.item_id, "Active")}>Start</button>
                        </div>
                      </Card.Body>
                    </Card>))}
                </Card.Body>
              </Card>

              <Card className='my-2'>
                <Card.Header>
                  <div className="d-flex justify-content-between">
                    <h4>Active Jobs @ {current_location.name}</h4>
                    <div class="btn-group btn-group-lg" role="group" aria-label="Basic example">
                      <button type="button" class="btn btn-danger btn-secondary">Stop All</button>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body>
                  {items_state && items_state['Active'] && items_state['Active'].map(item => (
                    <Card>
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <Card.Title>{item.name}</Card.Title>
                          <Card.Text>
                            {item.item_id}
                          </Card.Text>
                          <button type="button" class="btn btn-danger btn-secondary" onClick={() => onMessage(item.item_id, "Complete")}> Stop</button>
                        </div>
                      </Card.Body>
                    </Card>))}
                </Card.Body>
              </Card>

              <Card className='my-2'>
                <Card.Header>
                  <div className="d-flex justify-content-between">
                    <h4>Complete Jobs @ {current_location.name}</h4>
                    <div class="btn-group btn-group-lg" role="group" aria-label="Basic example">
                      <button type="button" class="btn btn-success btn-secondary">Resume All</button>
                    </div>
                  </div>
                </Card.Header>

                <Card.Body>
                  {items_state && items_state['Complete'] && items_state['Complete'].map(item => (
                    <Card>
                      <Card.Body>
                        <div className="d-flex justify-content-between">
                          <Card.Title>{item.name}</Card.Title>
                          <Card.Text>
                            {item.item_id}
                          </Card.Text>
                          <div class="btn-group" role="group" aria-label="Basic example">
                            <button type="button" class="btn btn-success btn-secondary" onClick={() => onMessage(item.item_id, "Active")}>Resume</button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>))}
                </Card.Body>
              </Card>

            </Col>
          </Row>
        </Container>
        <div className='bottom_bar'>
          <ButtonGroup aria-label="Basic example">
            <OverlayTrigger
              placement='top'
              overlay={<Tooltip>
                Live updates over MQTT: {text}
              </Tooltip>}
            >
              <Button variant={variant} className='bi bi-rss'>{" " + text}</Button>
            </OverlayTrigger>
          </ButtonGroup>
        </div>
      </Container></>
  )
}

function BarcodeEntry({ submit, barcode, setBarcode, barcodeRef, submitRef, handleSubmit, startOnAddButton, setstartOnAddButton }) {
  return <div>
    <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-upc-scan me-1' />Barcode</InputGroup.Text>
    <Form.Control
      ref={barcodeRef}
      placeholder="Barcode"
      value={barcode}
      onChange={(event) => setBarcode(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submit(barcode);
        }
      }}
    />
    <Button
      ref={submitRef}
      variant="success"
      disabled={!barcode}
      onClick={handleSubmit}
    >Add</Button>
    
    
    </InputGroup>
    <Form.Check
            label="Start on Add"
            value={startOnAddButton}
            onChange={(event) => setstartOnAddButton(event.target.checked)}
          />
  </div>
  
}

function DisplayItem({ item, pending, error }) {
  if (item == null) {
    return ""
  }

  let form_value = ""
  let form_disabled = false
  let text_value = ""
  if (error) {
    form_value = error
    form_disabled = true
    text_value = <i className='bi bi-exclamation-triangle' />
  } else if (pending) {
    text_value = <Spinner animation="border" variant="secondary" size="sm" />
  } else if (item) {
    form_value = item.name
    form_disabled = true
    text_value = <i className='bi bi-check2' />
  }

  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box me-1' />Item</InputGroup.Text>
    <Form.Control value={form_value} disabled={form_disabled} />
    <InputGroup.Text>{text_value}</InputGroup.Text>
  </InputGroup>
}

function SelectFrom({ item, current_location, location_list, from, setFrom, fromRef }) {
  if (item === null || item.individual) {
    return ""
  }

  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box-arrow-up-right me-1' />From</InputGroup.Text>
    <Form.Select ref={fromRef} value={from} onChange={(event) => setFrom(event.target.value)}>
      <option>Select ...</option>
      {location_list.map(loc => (
        loc.id !== current_location?.id ? <option key={loc.id} value={loc.id}>{loc.name}</option> : ""
      ))}
    </Form.Select>
  </InputGroup>
}

function SelectTo({ current_location, location_list, to, setTo, toRef }) {
  let content = ""
  if (current_location) {
    content = <Form.Control value={current_location.name} disabled />
  } else {
    content = <Form.Select ref={toRef} value={to} onChange={(event) => setTo(event.target.value)}>
      <option>Select ...</option>
      {location_list.map(loc => (
        <option key={loc.id} value={loc.id}>{loc.name}</option>
      ))}
    </Form.Select>
  }
  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box-arrow-in-down-right me-1' />To</InputGroup.Text>
    {content}
  </InputGroup>
}

function SetQuantity({ item, quantity, setQuantity, quantityRef, submitRef }) {
  if (item === null || item.individual) {
    return ""
  }
  return <InputGroup className="mb-3">
    <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box me-1' />Quantity</InputGroup.Text>
    <Form.Control
      ref={quantityRef}
      type="text"
      value={quantity}
      onChange={(event) => (setQuantity(event.target.value.replace(/\D/, '')))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submitRef.current.focus()
        }
      }}
    />
  </InputGroup>
}


// function BatchForm({ config }) {
//   let [product, setProduct] = React.useState("")
//   let [batch, setBatch] = React.useState("")
//   let [expires, setExpires] = React.useState("")
//   let [quantity, setQuantity] = React.useState("")

//   let { sendJsonMessage } = useMQTTControl()

//   let { product: c_product, batch: c_batch, expires: c_expires, quantity: c_quantity } = useMQTTState()

//   const onSubmit = () => {
//     if (product && batch && expires && quantity) {
//       sendJsonMessage("batch_details/" + config.id, { id: config.id, product: product, batch: batch, expires: expires, quantity: quantity }, 1, true);
//       setProduct("");
//       setBatch("");
//       setExpires("");
//       setQuantity("");
//     }
//   }

//   const fillCurrent = () => {
//     if (c_product)
//       setProduct(c_product);
//     if (c_batch)
//       setBatch(c_batch);
//     if (c_expires)
//       setExpires(c_expires);
//     if (c_quantity)
//       setQuantity(c_quantity);
//   }

//   return <Card className='my-2'>
//     <Card.Header><h4>Update Location:</h4></Card.Header>
//     <Card.Body>
//       <Form noValidate validated={true}>
//         <InputGroup className="mb-3">
//           <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box me-1' />Item</InputGroup.Text>
//           <Form.Control
//             placeholder="Barcode"
//             value={product}
//             onChange={(event) => setProduct(event.target.value)}
//             required
//             isValid={!!product}
//           />
//           <Button variant="primary">
//             Submit
//           </Button>
//         </InputGroup>

//         <InputGroup className="mb-3">
//           <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-box2 me-1' />Batch</InputGroup.Text>
//           <Form.Control
//             placeholder="Batch"
//             value={batch}
//             onChange={(event) => setBatch(event.target.value)}
//             required
//             isValid={!!batch}
//           />
//         </InputGroup>

//         <InputGroup className="mb-3">
//           <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-calendar-week me-1' />Expiry</InputGroup.Text>
//           <Form.Control
//             type="date"
//             value={expires}
//             onChange={(event) => setExpires(event.target.value)}
//             required
//             isValid={!!expires}
//           />
//         </InputGroup>

//         <InputGroup className="mb-3">
//           <InputGroup.Text style={{ width: "7em" }}><i className='bi bi-bullseye me-1' />Quantity</InputGroup.Text>
//           <Form.Control
//             type="text"
//             value={quantity}
//             onChange={(event) => setQuantity(event.target.value.replace(/\D/, ''))}
//             required
//             isValid={!!quantity}
//           />
//         </InputGroup>

//         <Button className='float-end' onClick={onSubmit}>Submit</Button>
//       </Form>
//     </Card.Body>
//   </Card>
// }

export default App;
