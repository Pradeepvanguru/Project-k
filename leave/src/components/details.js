import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Home() {
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timers, setTimers] = useState({});

  const fetchUserDetails = async (acceptedBy) => {
    try {
      const response = await axios.get(`https://gmrit-car-automation.onrender.com/api/registers/${acceptedBy}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  const fetchAcceptedRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://gmrit-car-automation.onrender.com/api/leave');
      const requests = response.data;

      const filteredRequests = requests.filter((request) => {
        const leaveDate = new Date(request.leaveDate);
        const currentDate = new Date();
        const differenceInDays = (currentDate - leaveDate) / (1000 * 3600 * 24);
        return differenceInDays <= 2;
      });

      const updatedRequests = await Promise.all(
        filteredRequests.map(async (request) => {
          if (request.acceptedBy) {
            const userDetails = await fetchUserDetails(request.acceptedBy);
            return { ...request, acceptedUserDetails: userDetails };
          }
          return request;
        })
      );

      updatedRequests.sort((a, b) => new Date(b.leaveDate) - new Date(a.leaveDate));
      setAcceptedRequests(updatedRequests);

      updatedRequests.forEach(request => {
        const savedTimer = localStorage.getItem(`timer_${request._id}`);
        if (savedTimer && parseInt(savedTimer, 10) <= 0) {
          setTimers(prevTimers => ({
            ...prevTimers,
            [request._id]: 0,
          }));
        } else if (savedTimer) {
          setTimers(prevTimers => ({
            ...prevTimers,
            [request._id]: parseInt(savedTimer, 10),
          }));
        } else {
          setTimers(prevTimers => ({
            ...prevTimers,
            [request._id]: 4 * 60,
          }));
        }
      });

    } catch (error) {
      console.error('Error fetching accepted requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => {
        const newTimers = {};
        Object.keys(prevTimers).forEach((requestId) => {
          const request = acceptedRequests.find(req => req._id === requestId);
          if (request && request.status === 'Accepted') {
            newTimers[requestId] = 0;
          } else if (prevTimers[requestId] > 0) {
            newTimers[requestId] = prevTimers[requestId] - 1;
            localStorage.setItem(`timer_${requestId}`, newTimers[requestId]);
          } else {
            newTimers[requestId] = 0;
            localStorage.setItem(`timer_${requestId}`, 0);
          }
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [acceptedRequests]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  useEffect(() => {
    fetchAcceptedRequests();
  }, []);

  function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }
//  const row = {  
//       width: "300px" /* Wider for the second column (Name) */  
//   } 

  return (
    <div className='container p-3'>
    <div>
      <div className="d-flex justify-content-between mb-2">
        <h4><u><b className='text-white'>Accepted Faculty Details :</b></u></h4>
        <button
          className="btn btn-dark mx-2 fs-5"
          onClick={fetchAcceptedRequests} >
          &#x1F504; Refresh
        </button>
      </div>
      <div>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div style={{ position: 'relative', height: '400px', overflowY: acceptedRequests.length > 5 ? 'scroll' : 'unset' }}>
            <table className="table table-bordered table-lg" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className='bg-warning text-center border-dark' style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  {/* Smaller columns */}
                  <th style={{ width: '5%' }}>Serial No.</th>
                  <th style={{ width: '15%' }}>Your Name</th>
                  <th style={{ width: '10%' }}>Leave Date</th>
                  <th style={{ width: '7%' }}>Branch</th>
                  <th style={{ width: '5%' }}>Year</th>
                  <th style={{ width: '8%' }}>Semester</th>
  
                  {/* Larger columns */}
                  <th style={{ width: '15%' }}>Faculty Name</th>
                  <th style={{ width: '18%' }}>Faculty Subject</th>
  
                  {/* Status and Timer */}
                  <th className='bg-success text-white' style={{ width: '8%' }}>Status</th>
                  <th className='bg-danger text-white' style={{ width: '8%' }}>Timer</th>
                </tr>
              </thead>
              <tbody className='bg-info text-center border-dark'>
                {acceptedRequests.length > 0 ? (
                  acceptedRequests.map((request, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: request.status === 'Pending' ? 'white' : 'cyan',
                        textAlign: 'center',
                        verticalAlign: 'middle',
                      }}
                    >
                      {/* Smaller cells */}
                      <td>{index + 1}</td>
                      <td>{request.name}</td>
                      <td>{formatDate(request.leaveDate) ? new Date(formatDate(request.leaveDate)).toLocaleDateString() : 'No Date Available'}</td> 
                      <td>{request.branch}</td>
                      <td>{request.acceptedUserDetails ? request.acceptedUserDetails.year : 'N/A'}</td>
                      <td>{request.acceptedUserDetails ? request.acceptedUserDetails.sem : 'N/A'}</td>
  
                      {/* Larger cells */}
                      <td>{request.acceptedUserDetails ? request.acceptedUserDetails.name : 'N/A'}</td>
                      <td>{request.acceptedUserDetails ? request.acceptedUserDetails.subj : 'N/A'}</td>
  
                      {/* Status and Timer */}
                      <td className='bg-white fw-bold text-success'>{request.status}</td>
                      <td>{timers[request._id] > 0 ? formatTime(timers[request._id]) : <span>Timeup</span>}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center">No accepted requests yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
  
  );
}

export default Home;
