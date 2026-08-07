import { Link } from "react-router-dom";
import "./Header.css";

const Header = () => {
  return (
    <header
      className="p-3"
      style={{ backgroundColor: "#0F172A" }}
    >
      <div className="container-fluid px-5">
        <div className="d-flex flex-wrap align-items-center justify-content-between">

          <Link
            to="/"
            className="d-flex align-items-center text-white text-decoration-none"
          >
            <h3 className="m-0 fw-bold">
              AI Digital Twin
            </h3>
          </Link>

          <ul className="nav">
            <li>
              <Link to="/" className="nav-link nav-item-custom">
                Home
              </Link>
            </li>

            <li>
              <Link to="/parents-dashboard" className="nav-link nav-item-custom">
                Parents Dashboard
              </Link>
            </li>

            <li>
              <Link to="/Library" className="nav-link nav-item-custom">
                Library
              </Link>
            </li>

            <li>
              <Link to="/TestPage" className="nav-link nav-item-custom">
                Tests
              </Link>
            </li>
          </ul>

          <form className="d-flex me-3">
            <input
              type="search"
              className="form-control"
              placeholder="Search..."
            />
          </form>

          <div>
  <Link to="/Login">
    <button className="btn btn-outline-light me-2 login-btn">
      Login
    </button>
  </Link>

  <Link to="/Signup">
    <button className="btn btn-outline-light me-2 signup-btn">
      Sign Up
    </button>
  </Link>
</div>

        </div>
      </div>
    </header>
  );
};

export default Header;