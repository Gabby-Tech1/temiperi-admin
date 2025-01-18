import { useState, useEffect } from "react";
import axios from "axios";
import "./report.css";

const Report = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    try {
      const response = await axios.get(
        "https://temiperi-stocks-backend.onrender.com/temiperi/get-reports"
      );
      setRecentReports(response.data.slice(0, 3)); // Get only the 3 most recent reports
      setLoading(false);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!title || !content) {
        alert("Please fill in both title and content");
        return;
      }

      await axios.post(
        "https://temiperi-stocks-backend.onrender.com/temiperi/create-report",
        {
          title,
          content,
          author: "Admin", // You might want to get this from user context/state
        }
      );

      // Clear form and refresh recent reports
      setTitle("");
      setContent("");
      fetchRecentReports();
    } catch (error) {
      console.error("Error creating report:", error);
      alert("Failed to save report");
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return {
      date: d.getDate(),
      month: d.getMonth() + 1,
    };
  };

  return (
    <div className="report_container">
      {/* <div className="recent_reports">
        <h3>Recent Reports</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          recentReports.map((report) => (
            <div key={report._id} className="report_dis">
              <p className="recent_report_title">{report.title}</p>
              <div className="report_time">
                <p>{formatDate(report.createdAt).date}th</p>
                <p>{formatDate(report.createdAt).month}</p>
              </div>
            </div>
          ))
        )}
      </div> */}

      <div className="report_body">
        <div>
          <label htmlFor="" className="">Title</label>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-black w-full p-2"
          />
        </div>
        <label htmlFor="" className="">Report</label>
        <textarea
          placeholder="write here"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border border-black"
        />
        <div className="btns">
          <button onClick={handleSubmit}>Save</button>
          <button
            onClick={() => (window.location.href = "https://mail.google.com/")}
          >
            Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default Report;
