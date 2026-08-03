import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="text-white pt-5 pb-3"
    style={{ backgroundColor: "#0F172A", marginTop: "2rem"}}
    >
      <div className="container">
        <ul className="nav justify-content-center border-bottom border-secondary pb-3 mb-3">
          <li className="nav-item">
            <Link to="/" className="nav-link px-2 text-white">
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/features" className="nav-link px-2 text-white">
              Features
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/pricing" className="nav-link px-2 text-white">
              Pricing
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/faqs" className="nav-link px-2 text-white">
              FAQs
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-link px-2 text-white">
              About
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;