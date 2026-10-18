import 'bootstrap-icons/font/bootstrap-icons.css';
import { Navbar, Nav, Button, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { LoginButton, LogoutButton } from './Authentication';


function Header(props) {

  const location = useLocation();//get current URL to display a different Header depending on location
  const navigate = useNavigate();//to go to desired URL

  const sizePrice = props.chosenSize.price;
  let ingredientsPrice = 0;

  for (let i = 0; i < props.orderIngredients.length; i++) {
    ingredientsPrice += props.orderIngredients[i].price
  }

  const total = sizePrice + ingredientsPrice;

  const handleSubmit = () => {
    props.addOrder();
  };


  return (
    <Navbar bg="primary" expand="md" variant="dark" className="navbar-padding px-3">
      <Navbar.Brand>
        <i className="bi bi-fork-knife me-2"></i>
        Restaurant
      </Navbar.Brand>
      {location.pathname != "/login" ? //if im in login screen i don't render the user info and login/logout buttons
        <Nav>
          <Navbar.Text className="mx-2 fs-5">
            {props.user && props.user.name &&
              `Logged in ${props.loggedInTotp ? '(2FA)' : ''} as: ${props.user.name}`}
          </Navbar.Text>
          <Form className="mx-2 mt-1">
            {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
          </Form>
        </Nav> : ""
      }

      <ButtonsTitle
        location={location.pathname}
        navigate={navigate}
        handleSubmit={handleSubmit}
        total={total}
        chosenSize={props.chosenSize}
        chosenDish={props.chosenDish}
        setDirty={props.setDirty}
        loggedIn={props.loggedIn}
        resetOrder={props.resetOrder} />
    </Navbar>
  )
}

//groups all the elements whose rendering depends on the current location
function ButtonsTitle(props) {
  if (props.location == "/new-order") {
    return (
      <>
        <Button className="mx-2" variant="outline-light" onClick={() => {
          props.setDirty(true); //to force retrieving data from server upon click
          props.navigate("/");
        }}>
          Main Page
        </Button>
        <Navbar.Text className="mx-auto text-white fw-bold">
          Create Your Dish
        </Navbar.Text>
        <Nav className="ms-auto d-flex align-items-center gap-3">
          <Navbar.Text className="text-white">
            {"Current choice: " + (props.chosenDish.label != "empty" ? props.chosenDish.label : "") + " "
              + (props.chosenSize.label != "empty" ? props.chosenSize.label : "") //don't render chosen dish and size if they are the initialization values
            }
          </Navbar.Text>
          <Navbar.Text className="text-white fw-bold">
            Total: €{props.total.toFixed(2)}
          </Navbar.Text>
          <Button variant="light" onClick={props.handleSubmit}>
            Submit Order
          </Button>
          <Button variant="light" onClick={props.resetOrder}>
            Reset Order
          </Button>
        </Nav>
      </>
    )

  }
  if (props.location == "/") {
    if (props.loggedIn) {//renders "New order" and "Past Orders buttons only if you are logged in "
      return (
        <>
          <Button className="mx-2" variant="outline-light" onClick={() => {
            props.setDirty(true); //to force retrieving data from server upon click
            props.navigate("/new-order");
          }}>
            New Order
          </Button>
          <Button className="mx-2" variant="outline-light" onClick={() => {
            props.setDirty(true); //to force retrieving data from server upon click
            props.navigate("/past-orders");
          }}>
            Past Orders
          </Button>
          <Navbar.Text className="mx-auto text-white fw-bold">
            Our Dishes and Ingredients
          </Navbar.Text>
        </>
      )
    } else {
      return (
        <Navbar.Text className="mx-auto text-white fw-bold">
          Our Dishes and Ingredients
        </Navbar.Text>
      )
    }

  }
  if (props.location == "/past-orders") {
    return (
      <>
        <Button className="mx-2" variant="outline-light" onClick={() => {
          props.setDirty(true); //to force retrieving data from server upon click
          props.navigate("/");
        }}>
          Main Page
        </Button>
        <Navbar.Text className="mx-auto text-white fw-bold">
          Orders History
        </Navbar.Text>
      </>
    )
  }
  if (props.location == "/login") {
    return (
      <>
        <Button className="mx-2" variant="outline-light" onClick={() => {
          props.setDirty(true); //to force retrieving data from server upon click
          props.navigate("/");
        }}>
          Main Page
        </Button>
        <Navbar.Text className="mx-auto text-white fw-bold">
          Login
        </Navbar.Text>
      </>
    )
  }

}

export default Header;
