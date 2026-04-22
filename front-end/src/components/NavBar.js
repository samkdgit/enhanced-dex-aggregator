import { Navbar, Container } from "react-bootstrap"
import 'bootstrap/dist/css/bootstrap.css';
import Account from "./Account"
import logo from '../dapp-logo.png';

function NavBar() {

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand
                        href="/"
                        className="d-flex align-items-center"
                        style={{ gap: "10px", fontWeight: 600 }}
                    >
                        <img
                            src={logo}
                            alt="Enhanced Dex Aggregator"
                            style={{ height: "34px", width: "34px", borderRadius: "8px" }}
                        />
                        <span>Enhanced Dex Aggregator</span>
                    </Navbar.Brand>
                    <Account />
                </Container>
            </Navbar>
        </>
    );
}

export default NavBar;
