import React from 'react';
import { Link } from 'react-router-dom';
import Home from './details';


  // const divStyle = { 
  //   Image: "url('https://uploads.sarvgyan.com/2014/05/GMRIT-Rajam.jpg')",  
  //   height: '40px', // Set your desired height  
  //   backgroundSize: 'cover', // Cover the entire div  
  //   backgroundPosition: 'center' ,// Center the image  
  //   filter:' blur(1px)'
  // }



function HomePage() {
  const back={ 
    opecity:'150px', 
    boxShadow: "0 4px 8px #fff, 0 8px 10px #f999" 
  }  
  return (
    <div className="container-fluid  bg-secondary  " > 
     <div className='p-5' > 
     
       {/* <nav className="navbar navbar-expand-lg navbar-light p-3 bg-warning rounded d-flex justifyContent-center alignItems-center ">
        <div className="container-fluid">
          <a className="navbar-brand" href="/home">Class_Adjustment_System</a>
          <div className="collapse navbar-collapse " id="navbarNav">
            <ul className="navbar-nav ml-auto">
              <li className="nav-item ">
                <Link to="/leaveform" className="nav-link btn btn-primary mx-2">
                  Apply_CAR
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/registration" className="nav-link btn btn-success mx-2">
                  Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav> */}
     
      <div className=" text-center text-dark p-5 rounded  bg-white " style={back} >
      <p style={{ float: 'left' }} >  
          <img src='https://uploads.sarvgyan.com/2014/05/GMRIT-Rajam.jpg' height={80}  className='rounded ' style={back} />  
     </p>
        <h1>Welcome to the Class Adjustment System....👋</h1>
        <p className="mt-3 " >
          Use this platform to manage class adjustments efficiently.
        </p>
        <div className="mt-5 ">
          <Link to="/leaveform" className="btn btn-primary mx-5 p-3" style={back}>
            Apply for Class Adjustment
          </Link>
          <Link to="/registration" className="btn btn-success mx-2 p-3" style={back}>
            Register Now
          </Link>
        </div>
      </div>
      </div>
    
  <div className='d-flex justifyContent-center  alignItems-center   '>
   <div className='m-2 p-3 container'>
     <Home  />
   </div>
  </div>


  </div>
    
  );
}

export default HomePage;
