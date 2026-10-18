import { useState } from 'react';
import { Form, Button, Alert, Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import API from '../API.js';


function LoginLayout(props) {
  return (
    <Row>
      <Col>
        <LoginForm login={props.login} />
      </Col>
    </Row>
  );
}

function TotpLayout(props) {
  return (
    <Row>
      <Col>
        <TotpForm totpSuccessful={props.totpSuccessful} />
      </Col>
    </Row>
  );
}

function TotpForm(props) {
  const [totpCode, setTotpCode] = useState('');
  const [loginErrorMsg, setLoginErrorMsg] = useState('');

  const navigate = useNavigate();

  const doTotpVerify = () => {
    API.totpVerify(totpCode)
      .then(() => {
        setLoginErrorMsg('');
        props.totpSuccessful();
        navigate('/');
      })
      .catch(() => {
        // NB: Generic error message
        setLoginErrorMsg('Wrong code, please try again');
      })
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoginErrorMsg('');

    // Some validation
    let valid = true;
    if (totpCode === '' || totpCode.length !== 6)
      valid = false;

    if (valid) {
      doTotpVerify(totpCode);
    } else {
      setLoginErrorMsg('Invalid content in form: either empty or not 6-char long');
    }
  };

  return (
    <Row>
      <Col xs={4}></Col>
      <Col xs={4}>

        <h2>Second Factor Authentication</h2>
        <h5>Please enter the code that you read on your device</h5>
        <Form onSubmit={handleSubmit}>
          {loginErrorMsg ? <Alert variant='danger' dismissible onClick={() => setLoginErrorMsg('')}>{loginErrorMsg}</Alert> : ''}
          <Form.Group controlId='totpCode'>
            <Form.Label>Code</Form.Label>
            <Form.Control type='text' value={totpCode} onChange={ev => setTotpCode(ev.target.value)} />
          </Form.Group>
          <Button className='my-2' type='submit'>Validate</Button>
          <Button className='my-2 mx-2' variant='danger' onClick={() => navigate('/')}>Cancel</Button>
        </Form>
      </Col>
      <Col xs={4}></Col>
    </Row>
  )

}

function LoginForm(props) {
  const [username, setUsername] = useState('u1@p.it');
  const [password, setPassword] = useState('pwd');

  const [loginErrorMsg, setLoginErrorMsg] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    if (!username) {
      setLoginErrorMsg('Username cannot be empty');
    } else if (!password) {
      setLoginErrorMsg('Password cannot be empty');
    } else {
      props.login(credentials)
        .catch((err) => {
          setLoginErrorMsg(err.error);
        });
    }
  };

  return (
    <Row>
      <Col xs={4}></Col>
      <Col xs={4}>
        <h1 className="pb-3">Login</h1>

        <Form onSubmit={handleSubmit}>
          {loginErrorMsg ? <Alert dismissible onClose={() => setLoginErrorMsg('')} variant="danger">{loginErrorMsg}</Alert> : null}
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={username} placeholder="Enter your email"
              onChange={(ev) => setUsername(ev.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              value={password} placeholder="Enter your password"
              onChange={(ev) => setPassword(ev.target.value)}
            />
          </Form.Group>
          <Button className="mt-3" type="submit">Login</Button>
        </Form>
      </Col>
      <Col xs={4}></Col>
    </Row>

  )
};

function LogoutButton(props) {
  return (
    <Button variant="outline-light" onClick={props.logout}>Logout</Button>
  )
}

function LoginButton(props) {
  const navigate = useNavigate();
  return (
    <Button variant="outline-light" onClick={() => navigate('/login')}>Login</Button>
  )
}



export { LoginLayout, TotpLayout, LoginButton, LogoutButton }