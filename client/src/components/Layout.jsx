import { Row, Col} from 'react-bootstrap';
import { Navigate } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import DishChoice from './DishChoice';
import DishChoiceFixed from './DishChoiceFixed';
import IngredientsList from './IngredientsList';
import IngredientsListFixed from './IngredientsListFixed';
import ChosenIngredientsList from './ChosenIngredientList';
import PastOrders from './PastOrders';


function MainPageLayout(props) {
    return (
        <Row>
            <Col xs={2}>
                <DishChoiceFixed sizes={props.sizes} dishes={props.dishes} loading={props.loading} />
            </Col>
            <Col xs={5}>
                <IngredientsListFixed ingredients={props.ingredients} loading={props.loading} />
            </Col>
            <Col xs={5}>
            </Col>
        </Row>
    )
}

function NewOrderPageLayout(props) {
    return (
        <Row>
            <Col xs={2}>
                <DishChoice chooseDish={props.chooseDish} chooseSize={props.chooseSize} sizes={props.sizes} dishes={props.dishes} chosenDish={props.chosenDish}
                    chosenSize={props.chosenSize} loading={props.loading} />
            </Col>
            <Col xs={5}>
                <IngredientsList ingredients={props.ingredients} add={props.add} loading={props.loading} />
            </Col>
            <Col xs={5}>
                {props.loggedIn ? //if user connects to this path and they are not authenticated, send them to home
                    <ChosenIngredientsList orderIngredients={props.orderIngredients} remove={props.remove} loading={props.loading} />
                    : <Navigate to={"/"} />
                }
            </Col>
        </Row>
    )
}

function PastOrdersPageLayout(props) {
    return (
        <Row>
            <Col xs={2}>
            </Col>
            <Col xs={8}>
                {props.loggedIn ? //if user connects to this path and they are not authenticated, send them to home
                    <PastOrders orders={props.orders} cancel={props.cancel} loggedInTotp={props.loggedInTotp}
                        dirty={props.dirty} setDirty={props.setDirty} setOrdersList={props.setOrdersList} handleErrors={props.handleErrors} />
                    : <Navigate to={"/"} />
                }
            </Col>
        </Row>
    )
}

export { MainPageLayout, NewOrderPageLayout, PastOrdersPageLayout }