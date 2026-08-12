import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import { AuthContext } from "../context/AuthContext";

const SignupForm = () => {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const [student, setStudent] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    board: "",
    grade: "",
    guardianEmail: "",
  });

  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [examDate, setExamDate] = useState(null);
  const [isMinor, setIsMinor] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudent({ ...student, [name]: value });
  };

  const calculateAge = (dob) => {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const handleDobChange = (date) => {
    setDateOfBirth(date);
    if (date) {
      const age = calculateAge(date);
      setIsMinor(age < 18);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !student.name ||
      !student.email ||
      !student.password ||
      !student.confirmPassword ||
      !dateOfBirth ||
      !student.board ||
      !student.grade
    ) {
      alert("Please fill all required fields!");
      return;
    }

    const age = calculateAge(dateOfBirth);

    // PRD Section 3.8: we do not onboard under-13
    if (age < 13) {
      alert("Sorry, this platform currently supports students aged 13 and above.");
      return;
    }

    if (student.password !== student.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // PRD: minors require verified guardian consent before any data is stored
    if (age < 18 && !student.guardianEmail) {
      alert("Guardian email is required for students under 18.");
      return;
    }

    const { confirmPassword, ...studentData } = student;
    studentData.dateOfBirth = dateOfBirth.toISOString().split("T")[0];
    studentData.examDate = examDate ? examDate.toISOString().split("T")[0] : null;
    studentData.age = age;
    studentData.consentStatus = age < 18 ? "pending_guardian_verification" : "not_required";

    setLoading(true);

    const result = await signup(studentData);
    setLoading(false);

    if (result.success) {
      navigate("/");
    } else {
      alert("Signup failed: " + (result.error || "Could not complete signup"));
    }
  };

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "80vh" }}
    >
      <div
        className="card shadow-lg p-4"
        style={{
          width: "100%",
          maxWidth: "450px",
          borderRadius: "15px",
        }}
      >
        <h3 className="text-center fw-bold mb-2">
          Create Your Student Profile
        </h3>

        <p className="text-center text-muted mb-4">
          Your AI Digital Twin starts here
        </p>

        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control form-control-sm"
              name="name"
              value={student.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-block">Date of Birth</label>
            <DatePicker
              selected={dateOfBirth}
              onChange={handleDobChange}
              maxDate={new Date()}
              showYearDropdown
              yearDropdownItemNumber={60}
              scrollableYearDropdown
              dateFormat="dd/MM/yyyy"
              placeholderText="Select your date of birth"
              className="form-control form-control-sm"
              wrapperClassName="w-100"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Board / Curriculum</label>
            <select
              className="form-select form-select-sm"
              name="board"
              value={student.board}
              onChange={handleChange}
            >
              <option value="">-- Select Board --</option>
              <option value="CBSE">CBSE</option>
              <option value="ICSE">ICSE</option>
              <option value="State Board">State Board</option>
              <option value="University / Undergraduate">University / Undergraduate</option>
              <option value="Competitive Exam">Competitive Exam (UPSC, SSC, JEE, NEET, etc.)</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Grade / Class / Year</label>
            <input
              type="text"
              className="form-control form-control-sm"
              name="grade"
              value={student.grade}
              onChange={handleChange}
              placeholder="e.g. Grade 10, B.Tech 3rd Year, UPSC Aspirant"
            />
          </div>

          <div className="mb-3">
            <label className="form-label d-block">
              Upcoming Exam Date <span className="text-muted">(optional)</span>
            </label>
            <DatePicker
              selected={examDate}
              onChange={(date) => setExamDate(date)}
              minDate={new Date()}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select exam date"
              className="form-control form-control-sm"
              wrapperClassName="w-100"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control form-control-sm"
              name="email"
              value={student.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control form-control-sm"
              name="password"
              value={student.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control form-control-sm"
              name="confirmPassword"
              value={student.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
            />
          </div>

          {isMinor && (
            <div className="mb-3">
              <label className="form-label">
                Guardian Email <span className="text-muted">(required for under-18)</span>
              </label>
              <input
                type="email"
                className="form-control form-control-sm"
                name="guardianEmail"
                value={student.guardianEmail}
                onChange={handleChange}
                placeholder="Parent/Guardian email for consent"
              />
              <small className="text-muted">
                As per our policy, students under 18 need verified guardian consent before their profile is created.
              </small>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100 py-2"
          >
            Create Profile
          </button>

          <p className="text-center mt-3 mb-0">
            Already have an account?{" "}
            <Link to="/login" className="text-decoration-none fw-semibold">
              Login
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default SignupForm;