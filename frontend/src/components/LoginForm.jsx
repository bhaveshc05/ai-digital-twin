import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LoginForm = () => {

  const navigate = useNavigate();

  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {

    const { name, value } = e.target;

    setUser({
      ...user,
      [name]: value,
    });

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser) {
      alert("Please Sign Up first!");
      return;
    }

    if (
  savedUser.email === user.email &&
  savedUser.password === user.password
) {

  localStorage.setItem("isLoggedIn", "true");

  navigate("/");
    } else {
      alert("Invalid Email or Password!");
    }

  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div
        className="card shadow-lg p-4"
        style={{ width: "100%", maxWidth: "400px", borderRadius: "15px" }}
      >
        <h3 className="text-center fw-bold mb-2">
          Welcome Back
        </h3>

        <p className="text-center text-muted mb-4">
          Login to continue
        </p>

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label className="form-label">
              Email
            </label>

            <input
              type="email"
              className="form-control form-control-sm"
              name="email"
              value={user.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Password
            </label>

            <input
              type="password"
              className="form-control form-control-sm"
              name="password"
              value={user.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
          >
            Login
          </button>

          <div className="text-center mt-3">

            <p className="mb-2">
              <Link
                to="/forgotpassword"
                className="text-decoration-none"
              >
                Forgot Password?
              </Link>
            </p>

            <p className="mb-0">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-decoration-none fw-semibold"
              >
                Sign Up
              </Link>
            </p>

          </div>

        </form>
      </div>
    </div>
  );
};

export default LoginForm;