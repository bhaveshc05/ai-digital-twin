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
              <Link to="/library" className="nav-link nav-item-custom">
                Library
              </Link>
            </li>

            <li>
              <Link to="/test" className="nav-link nav-item-custom">
                Test Practice
              </Link>
            </li>

            <li>
              <Link to="/parents-dashboard" className="nav-link nav-item-custom">
                Parents Dashboard
              </Link>
            </li>

            <li>
              <Link to="/pricing" className="nav-link nav-item-custom">
                Pricing
              </Link>
            </li>

            <li>
              <Link to="/faqs" className="nav-link nav-item-custom">
                FAQs
              </Link>
            </li>

            <li>
              <Link to="/about" className="nav-link nav-item-custom">
                About
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
            <Link to="/login">
              <button className="btn btn-outline-light me-2 login-btn">
                Login
              </button>
            </Link>

            <Link to="/signup">
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