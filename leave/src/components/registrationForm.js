import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';


const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    year: '',
    sem: '',
    email: '',
    section: '',
    branch: '',
    name: '',
    subj: ''
  });
  
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);

  const subjectsData = {
    1: {
      1: ['Maths', 'Physics', 'Chemistry', 'English', 'Computer Science', 'Electronics'],
      2: ['Biology', 'Statistics', 'History', 'Geography', 'C Programming', 'Data Structures']
    },
    2: {
      3: ['Database Management Systems', 'Data Communication Systems', 'OOP through Java', 'Discrete Mathematical Structures', 'Digital Logic Design', 'Python programming and Applications'],
      4: ['Web Development', 'Mobile Apps', 'Machine Learning', 'AI', 'Ethical Hacking', 'Cloud Computing']
    },
    3: {
      5: ['Design and Analysis of Algorithms', 'Artificial Intelligence', 'Cloud Computing', 'Software Engineering Principles', 'Exploratory Data Analytics(AI & ML)', 'Web Programming Languages(Full stack)','Fundamentals of Security','Term paper'],
      6: ['Quantum Computing', 'Embedded Systems', 'Data Mining', 'Game Development', 'Web Security', 'Blockchain']
    },
    4: {
      7: ['Project Management', 'Information Retrieval', 'HCI', 'IT Ethics', 'E-Commerce', 'Digital Marketing'],
      8: ['Research Methodology', 'Software Testing', 'Data Visualization', 'System Modeling', 'DevOps', 'Content Management']
    }
  };

  const branches = ["IT", "CSE", "MECH", "Civil", "EEE", "ECE", "AIDS"];
  const sectionsData = {
    IT: ['A', 'B'],
    CSE: ['A', 'B'],
    MECH: ['A', 'B', 'C'],
    Civil: ['A', 'B'],
    EEE: ['A', 'B'],
    ECE: ['A', 'B'],
    AIDS: ['A', 'B']
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));

    // Handle year change
    if (name === 'year') {
      setFormData(prevData => ({ ...prevData, sem: '', subj: '' }));
    }

    // Handle semester change
    if (name === 'sem') {
      setSubjects(subjectsData[formData.year][value]);
    }
  };

  const handleBranchChange = (e) => {
    const selectedBranch = e.target.value;
    setFormData(prevData => ({ ...prevData, branch: selectedBranch, section: '' })); // Reset section when branch changes
    setSections(sectionsData[selectedBranch] || []); // Update sections based on selected branch
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://gmrit-car-automation.onrender.com/registers', formData);
      alert("Registration successful...!!");
      
      console.log(response);
    } catch (error) {
      console.error('There was an error registering!', error);
      alert('Registration failed!');
    }
  };

  const getSemesters = (year) => {
    switch (year) {
      case '1': return [1, 2];
      case '2': return [3, 4];
      case '3': return [5, 6];
      case '4': return [7, 8];
      default: return [];
    }
  };
  const back={ 
    opecity:'150px', 
    boxShadow: "0 4px 8px #f333, 0 8px 10px #f333" 
  } 
  return (
    <div className='col-sm-12  p-5 bg-secondary vh-100'>
      <div style={{float:'left'}}>
        <Link to="/" className="btn btn-primary mx-2" style={back}>
          <h4>&#8592; Back</h4>
        </Link>
      </div>
      
      <div className='col-sm-7 container rounded'>
        <div className='bg-warning rounded p-4'>
          <form onSubmit={handleSubmit}>
          <center><h3  className=' p-1 rounded' style={back}>Registered Here..  </h3><br /></center>

            <div className='row' style={{ float: 'left' }}>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='fw-bold'>Branch</label>
                  <select className='form-control mb-3' name="branch" value={formData.branch} onChange={handleBranchChange} required>
                    <option value="">Select Branch</option>
                    {branches.map((branch, index) => (
                      <option key={index} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='fw-bold'>Year</label>
                  <select className='form-control mb-3' name="year" value={formData.year} onChange={handleChange} required>
                    <option value="">Select Year</option>
                    <option value="1">1 year</option>
                    <option value="2">2 year</option>
                    <option value="3">3 year</option>
                    <option value="4">4 year</option>
                  </select>
                </div>
              </div>
            </div>

            <div className='row'>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='fw-bold'>Semester</label>
                  <select className='form-control mb-3' name="sem" value={formData.sem} onChange={handleChange} required disabled={!formData.year}>
                    <option value="">Select Semester</option>
                    {getSemesters(formData.year).map(sem => (
                      <option key={sem} value={sem}>{sem} sem</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='fw-bold'>Section</label>
                  <select className='form-control mb-3' name="section" value={formData.section} onChange={handleChange} required disabled={!formData.branch}>
                    <option value="">Select Section</option>
                    {sections.map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
              </div>                 
            </div>

            <div className='row'>
            <div className='col-md-6'>
                <div className='form-group'>
                  <label className='fw-bold'>Subject</label>
                  <select className='form-control mb-3' name="subj" value={formData.subj} onChange={handleChange} required disabled={!formData.sem}>
                    <option value="">Select Subject</option>
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='fw-bold'>Name</label>
                  <input className='form-control mb-3' name="name" value={formData.name} onChange={handleChange} required placeholder='start with Mr./Mrs.' />
                </div>
              </div>
              
              <div className='col-md-6'>
                <div className='form-group'>
                  <label className='fw-bold'>Email</label>
                  <input className='form-control mb-3' type="email" name="email" value={formData.email} onChange={handleChange} required placeholder='Enter your email' />
                </div>
              </div>
            </div>
            <center>
              <button className='btn btn-primary w-100' type="submit">Register</button>
            </center>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
