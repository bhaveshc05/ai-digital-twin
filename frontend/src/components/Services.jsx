import "./Services.css";

const services = [
  {
    icon: "📚",
    title: "Smart Knowledge Ingestion",
    description:
      "Upload your notes, PDFs, or handwritten pages — we turn them into organized, searchable knowledge instantly.",
  },
  {
    icon: "🧠",
    title: "AI Digital Twin Profile",
    description:
      "A continuously evolving profile that learns your strengths, weaknesses, and study patterns better every day.",
  },
  {
    icon: "🎯",
    title: "Struggle Topic Prediction",
    description:
      "Know exactly where you're likely to lose marks — before your exam, not after.",
  },
  {
    icon: "📝",
    title: "Personalized Quizzes",
    description:
      "Quizzes generated just for you, targeting your weak spots, calibrated to your level.",
  },
  {
    icon: "📅",
    title: "Smart Revision Planner",
    description:
      "A day-by-day study schedule built around your exam date and your actual weaknesses.",
  },
  {
    icon: "🎙️",
    title: "Oral Exam Simulator",
    description:
      "Practice your viva with an AI examiner that asks real follow-up questions and gives feedback.",
  },
];

const Services = () => {
  return (
    <section className="services-section pt-5">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Our Services</h2>
          <p className="text-muted">
            Everything you need to study smarter, not harder
          </p>
        </div>

        <div className="row g-4">
          {services.map((service, index) => (
            <div className="col-12 col-md-6 col-lg-4" key={index}>
              <div className="service-card h-100 p-4 text-center">
                <div className="service-icon mb-3">{service.icon}</div>
                <h5 className="fw-bold mb-2">{service.title}</h5>
                <p className="text-muted mb-0">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;