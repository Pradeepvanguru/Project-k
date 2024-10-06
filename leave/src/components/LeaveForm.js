import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function LeaveForm() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm();
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dayName, setDayName] = useState(''); // To store the day name
  const [sections, setSections] = useState([]);
  const [name, setFacultyNames] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const semestersData = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8],
  };

  // Time slots for periods
  const periodTimes = {
    1: { startTime: '09:00 AM', endTime: '10:00 AM' },
    2: { startTime: '10:00 AM', endTime: '11:00 AM' },
    3: { startTime: '11:10 AM', endTime: '12:10 PM' },
    4: { startTime: '12:00 PM', endTime: '01:10 PM' },
    5: { startTime: '02:00 PM', endTime: '03:00 PM' },
    6: { startTime: '03:00 PM', endTime: '04:00 PM' },
    7: { startTime: '04:00 PM', endTime: '05:00 PM' },
  };

  const onYearChange = (year) => {
    setValue('sem', ''); // Reset semester and subjects when year changes
    
    if (year) {
      setSemesters(semestersData[year]); // Update semesters based on year
      handleSemesterChange(semestersData[year][0]); // Automatically set to first semester
    } else {
      setSemesters([]);
    }
  };

  // Function to handle changes when the semester is selected
  const handleSemesterChange = (sem) => { 
    const year = watch('year');  // Get the selected year
    if (year && semestersData[year].includes(sem)) {
      // Proceed with semester-specific logic
      console.log(`Selected semester ${sem} for year ${year}`);
    } else {
      console.log('Selected semester is not valid for the chosen year');
    }
  };

  // Function to get the day name from the selected date
  const handleDateChange = (event) => {
    const selectedDate = new Date(event.target.value);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    setDayName(dayName); // Update day name state
    setValue('dayName', dayName); // Update the form value for dayName
  };

  // Automatically update start and end times based on the selected period
  const handlePeriodChange = (event) => {
    const period = event.target.value;
    if (periodTimes[period]) {
      setValue('startTime', periodTimes[period].startTime); // Set start time
      setValue('endTime', periodTimes[period].endTime); // Set end time
    }
  };

  const onSubmit = (data, event) => {
    event.preventDefault(); // Prevent form's default behavior
    // console.log('Form data:', data);
    console.log('Validation errors:', errors);
    setIsSubmitting(true);
    axios.post('https://gmrit-car-automation.onrender.com/api/leave', data)
      .then((response) => {
        console.log('Form submitted successfully', response);
        reset();
        navigate('/');
        // alert('Class Adjustment Form submitted successfully');
      })
      .catch((error) => {
        console.error('There was an error submitting the form!', error);
        setIsSubmitting(false);
      });
  };

  const branches = ["IT", "CSE", "MECH", "Civil", "EEE", "ECE", "AIDS"];

  const fetchFacultyData = async ({ email, branch, sem, year }) => {
    try {
      const response = await axios.post('https://gmrit-car-automation.onrender.com/api/getFacultyData', { email, branch, sem, year });
      if (response.data) {
        setFacultyNames(response.data.name ); // Set the name from the response
        setSubjects(response.data.subjects || ''); // Set subjects from the response
        setSections(response.data.sections || ''); // Set sections from the response
      }
    } catch (error) {
      console.error('Error fetching faculty data', error);
    }
  };

  // Trigger fetching faculty data when email, branch, sem, or year change
  useEffect(() => {
    const email = watch('email');
    const branch = watch('branch');
    const sem = watch('sem');
    const year = watch('year');

    if (email && branch && sem && year) {
      fetchFacultyData({ email, branch, sem, year });
    }
  }, [watch('email'), watch('branch'), watch('sem'), watch('year')]);

  const back={ 
    opecity:'150px', 
    boxShadow: " 2px 0px 1px #fff,0 2px  10px #F33566" 
  }  
  return (
    <div className='col-sm-12  m-5 '>
    <div style={{ float: 'left' }} className='shadow-lg  p-1 '>
          <Link to="/" className="btn btn-primary  rounded-lg" style={back}>
            <h4>&#8592; Back</h4>
          </Link>
        </div>
      <div className=' p-3 m-2 '>
        

        <div className='col-sm-10 container-fluid rounded bg-secondary p-5'>
          <form onSubmit={handleSubmit(onSubmit)} className='form-group'>
            <center>
              <h3><b className='p-1 rounded text-dark bg-white ' style={back}>Class Adjustment Request Form...👋</b></h3>
              <br /><br></br>
            </center>

            {/* Branch ,year*/}
            <div className='row' style={{ float: 'left' }}>
              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Branch</label></b>
                <span style={{ color: 'red', float: 'left', marginLeft: '2px' }} >*</span>
                <select {...register('branch')} className='form-control mb-3' required >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Year</label></b>
                <span style={{ color: 'red', float: 'left', marginLeft: '2px' }} >*</span>
                <select {...register('year')} className='form-control mb-3' required onChange={(e) => onYearChange(e.target.value)}>
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            {/* Semester & Section */}
            <div className='row'>
              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Semester</label></b>
                <span style={{ color: 'red', float: 'left', marginLeft: '2px' }} >*</span>
                <select {...register('sem')} className='form-control mb-3' required onChange={(e) => handleSemesterChange(e.target.value)}>
                  <option value="">Select Semester</option>
                  {(semesters || []).map((sem) => (
                    <option key={sem} value={sem}>{sem} Semester</option>
                  ))}
                </select>
              </div>

              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Email</label></b>
                <span style={{ color: 'red', float: 'left', marginLeft: '2px' }} >*</span>
                <input {...register('email')} type='email' className='form-control mb-3' required placeholder='Registration email' />
              </div>
            </div>

            {/* Name & Email */}
            <div className='row'>
              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Name</label></b>
                <span style={{ color: 'red', float: 'left', marginLeft: '2px' }} >*</span>
                <input {...register('name', { required: true })} type='name' className='form-control mb-3' value={name ||''} readOnly placeholder='name' />
              </div>
              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Section</label></b>
                <span style={{ color: 'red', float: 'left', marginLeft: '2px' }} >*</span>
                <select {...register('section')} className='form-control mb-3' required>
                  <option value="">Select Section</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>
              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Subject Name</label></b>
                <span style={{ color: 'red', float: 'left', marginLeft: '2px' }} >*</span>
                <select {...register('subj')} className='form-control mb-3' required>
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              
              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Which Period</label></b>
                <span style={{ color: 'red', float: 'left', marginLeft: '2px' }} >*</span>
                <select {...register('period')} className='form-control mb-3' required onChange={handlePeriodChange}>
                  <option value="">Select Period</option>
                  <option value="1">Period 1</option>
                  <option value="2">Period 2</option>
                  <option value="3">Period 3</option>
                  <option value="4">Period 4</option>
                  <option value="5">Period 5</option>
                  <option value="6">Period 6</option>
                  <option value="7">Period 7</option>
                </select>
              </div>
            </div>

            {/* Period */}
            <div className='row'>
            <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Start Time</label></b>
                <input {...register('startTime')} type='text' className='form-control mb-3' readOnly />
              </div>

              <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>End Time</label></b>
                <input {...register('endTime')} type='text' className='form-control mb-3' readOnly />
              </div>
             
            </div>

              {/* Leave date and day */}
              <div className='row'>
            <div className='col-md-6'>
                <b><label style={{ float: 'left' }}>Leave Date</label></b>
                <span style={{ color: 'red',float:'left', marginLeft:'2px' }} >*</span>
                <input {...register('leaveDate')} type='date' className='form-control mb-3' required onChange={handleDateChange}  />
              </div>

              <div className='col-md-6'>
               <b><label style={{ float: 'left' }}>Day</label></b>
                <input {...register('dayName',{ required: true })} type='text' className='form-control mb-3' value={dayName} readOnly />
            </div>
            </div>
            <center>
            <label className='text-warning'>Note: please submit the button on dubble click..!</label>
              <button type="submit"  className='btn btn-warning mt-4 p-2 w-100 fs-5 fw-bold text-white' disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </center>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LeaveForm;
