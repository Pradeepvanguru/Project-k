const express = require('express');
const router = express.Router();
const LeaveRequest = require('../models/LeaveRequest');
const nodemailer = require('nodemailer');
const Register = require('../models/registrations');
const Remainder = require('../models/remainderModel'); // Remainder database model
const auth = require('../env.js');

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: auth.EMAIL_USER,
    pass: auth.EMAIL_PASS,
  },
});

// Helper function to send an email
const sendEmail = async (to, subject, html) => {
  return transporter.sendMail({
    from: auth.EMAIL_USER,
    to,
    subject,
    html,
  });
};

// Function to display a countdown timer in an email
const generateTimerHtml = (minutes) => {
  return `
    <div>
      <h2>Time Remaining: ${minutes} minutes</h2>
      <p>Please act before the time expires!</p>
    </div>
  `;
};

// Format date utility
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}


// Function to handle expiration at 09:59 PM
// const checkEmailExpiration = async (leaveRequest) => {
//   const currentTime = new Date();
//   const requestDate = new Date(leaveRequest.leaveDate);
//   requestDate.setHours(23,59,59); // Set expiration time to 11:59 PM

//   if (currentTime >= requestDate) {
//     leaveRequest.status = 'Pending';
//     await leaveRequest.save();
//     console.log('Request expired:', leaveRequest._id);
//     return true;
//   }
//   return false;
// };


// Set interval to delete 'claimed' records every 1 minute
// setTimeout(async () => {
//   try {
//     await LeaveRequest.deleteMany({ status: 'Pending' });
//     // console.log('Deleted Pending records from leaveRequest database.');
//     console.log('This mail is expired successfully...no one access this mail..!')
//   } catch (error) {
//     console.error('Error deleting claimed records:', error);
//   }
// }, 5*60 * 1000); // 1 minute interval

// Set interval to delete only 'claimed' records with first priority every 1 minute
// 1 minute = 60 * 1000 ms


// Function to handle email expiration and resending
  // const handleEmailTimeout = async (leaveRequest, priority, nextPriorityHandler) => {
  //   setTimeout(async () => {
  //     const acceptedLeave = await LeaveRequest.findById(leaveRequest._id);
  //     if (!acceptedLeave || acceptedLeave.status !== 'Accepted') {
  //       await nextPriorityHandler(leaveRequest);
  //     }
  //   }, 1 * 60 * 1000); // 1-minute delay for each priority stage
  // };
  

// Function to handle each priority case
// Function to handle each priority case
const handleEmailTimeout = async (leaveRequest, priority, nextPriorityHandler) => {
  setTimeout(async () => {
    const acceptedLeave = await LeaveRequest.findById(leaveRequest._id);
    if (!acceptedLeave || acceptedLeave.status !== 'Accepted') {
      await nextPriorityHandler(leaveRequest);
    }
  }, 1 * 60 * 1000); // 1-minute delay for each priority stage
};

const handleLeaveRequest = async (leaveRequest, priority, previousEmails = []) => {
  let users = [];
  let condition = { sem: leaveRequest.sem, year: leaveRequest.year, branch: leaveRequest.branch, acceptedUserEmail: leaveRequest.email, status:leaveRequest.status};
  let condition1 = { sem: leaveRequest.sem, year: leaveRequest.year, branch: leaveRequest.branch, email: { $ne: leaveRequest.email }, section: leaveRequest.section };
  let condition2 = { sem: leaveRequest.sem, year: leaveRequest.year, branch: leaveRequest.branch, subj: leaveRequest.subj, email: { $ne: leaveRequest.email } };
  let condition3 = { sem: leaveRequest.sem, year: leaveRequest.year, branch: leaveRequest.branch, email: { $ne: leaveRequest.email } };

  if (priority === 1) {
    const remainderUsers = await Remainder.find(condition);
    users = remainderUsers.map(user => ({ email: user.requesterEmail }));
    console.log(users, 'priority-1:sending email to reminders Faculty is done.');
  } else if (priority === 2) {
    condition1.email = { $nin: [leaveRequest.email, ...previousEmails] };
    users = await Register.find(condition1);
    console.log(users, 'priority-2: sending same section Faculty is Done');
  } else if (priority === 3) {
    condition2.email = { $nin: [leaveRequest.email, ...previousEmails] };
    users = await Register.find(condition2);
    console.log(users, 'priority-3: Sending email to same subject Faculty is Done.');
  } else if (priority === 4) {
    condition3.email = { $nin: [leaveRequest.email, ...previousEmails] };
    users = await Register.find(condition3);
    console.log(users, 'priority-4: sending email to same semister faculty is Done.');
  }
 
  
  // Skip current priority if no users are found and continue to the next priority without applying the time limit
  if (users.length === 0) {
    console.log(`No users found for priority ${priority}, skipping to the next priority.`);
    return previousEmails;
  }

  // Get valid email addresses and ensure there are no undefined/invalid email addresses
  const emailAddresses = users.map(user => user.email).filter(email => email);

  if (emailAddresses.length === 0) {
    console.log('No valid email addresses found for priority:', priority);
    return previousEmails; // No valid emails, return previous list
  }

  // Add to previously notified users
  const allNotifiedEmails = [...previousEmails, ...emailAddresses];

  const emailMessage = `
    <div style=" display:flex;align-items:center;justify-content:center; color:white; background-color:grey; border:2px solid yellow;  border-radius:3rem;">
     <div style="padding:20px;margin:15px;">
      <h2>Class Adjustment Request from <b style="color:yellow; font-size:25px; padding:3px;">${leaveRequest.name}..👋<b></h2>
      <p>${generateTimerHtml(1)}</p>
    <table style="font-size:18px; color:white; width:100%;">
           <tr>
            <td>Branch</td>
            <td><b>: ${leaveRequest.branch} year</b></td>
          </tr>
          <tr>
          <tr>
            <td>Year</td>
            <td><b>: ${leaveRequest.year} year</b></td>
          </tr>
          <tr>
            <td>Semester</td>
            <td><b>: ${leaveRequest.sem} sem</b></td>
          </tr>
          <tr>
           <tr>
            <td>Section</td>
            <td><b>: ${leaveRequest.section} </b></td>
          </tr>
          <tr>
            <td>Subject Name</td>
            <td><b>: ${leaveRequest.subj}</b></td>
          </tr>
          <tr>
            <td>Which Period</td>
            <td><b>: ${leaveRequest.period}</b></td>
          </tr>
          <tr>
            <td>Period Timings</td>
            <td><b>: ${leaveRequest.startTime}</b> To <b>${leaveRequest.endTime}</b></td>
          </tr>
          <tr>
            <td>Leave Date </td>
            <td><b>: ${formatDate(leaveRequest.leaveDate)}</b> on <b>${leaveRequest.dayName}<b></td>
          </tr>
        </table>
        <p>
         <a href="hhttps://gmrit-car-automation.onrender.com/api/leave/accept/${leaveRequest._id}?acceptingEmail={{userEmail}}&priority=${priority}" style="padding: 14px; background-color: green; color: white;font-size:18px;">Accept</a>
      <a href="https://gmrit-car-automation.onrender.com/api/leave/reject/${leaveRequest._id}?rejectingEmail={{userEmail}}" style="padding: 14px; background-color: red; color: white;font-size:18px;">Reject</a>
      </p>
     </div>
    </div>
  `;

  // Send email to all valid recipients
  await Promise.all(emailAddresses.map(userEmail =>
    sendEmail(userEmail, 'Class Adjustment Request', emailMessage.replace('{{userEmail}}', userEmail))
  ));

  return allNotifiedEmails; // Return the updated list of notified users
};

router.post('/', async (req, res) => {
  const { year, sem, name, email, subj, leaveDate, period, branch, section, startTime, endTime,dayName } = req.body;

  try {
    const leaveRequest = new LeaveRequest({
      name, email, sem, year, leaveDate, period, subj, branch, section, startTime, endTime,dayName
    });
    await leaveRequest.save();

    let notifiedUsers = [];

    // Priority-1
    notifiedUsers = await handleLeaveRequest(leaveRequest, 1, notifiedUsers);
    handleEmailTimeout(leaveRequest, 1, async () => {
      const requestStatus = await LeaveRequest.findById(leaveRequest._id);
      if (requestStatus.status === 'Accepted') {
        console.log('Request already accepted, stopping further phases.');
        return; // Stop further phases if the request is already accepted
      }

      // Priority-2
      notifiedUsers = await handleLeaveRequest(leaveRequest, 2, notifiedUsers);
      handleEmailTimeout(leaveRequest, 2, async () => {
        const requestStatus = await LeaveRequest.findById(leaveRequest._id);
        if (requestStatus.status === 'Accepted') {
          console.log('Request already accepted, stopping further phases.');
          return; // Stop further phases if the request is already accepted
        }

        // Priority-3
        notifiedUsers = await handleLeaveRequest(leaveRequest, 3, notifiedUsers);
        handleEmailTimeout(leaveRequest, 3, async () => {
          const requestStatus = await LeaveRequest.findById(leaveRequest._id);
          if (requestStatus.status === 'Accepted') {
            console.log('Request already accepted, stopping further phases.');
            return; // Stop further phases if the request is already accepted
          }

          // Priority-4 (final)
          notifiedUsers = await handleLeaveRequest(leaveRequest, 4, notifiedUsers);
          handleEmailTimeout(leaveRequest, 4, async () => {
            const leaveStatus = await LeaveRequest.findById(leaveRequest._id);
            if (leaveStatus && leaveStatus.status === 'Pending') {
              await sendEmail(leaveRequest.email, 'No Response to Leave Request', `
                <div style="align-items:center; color:bleck; background-color:yellow; padding:10px; ">
                  <h1>No one accepted your leave request....</h1>
                  <h3>Leave Date: <b> ${formatDate(leaveRequest.leaveDate)} <b> on <b>${leaveRequest.dayName}<b></h3>
                </div>
              `);
            }
          });
          console.log('Time up ..No one accepted your request...try another day..')
        });
      });
    });
   
    res.status(201).json({ message: 'Request submitted successfully.' });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





router.get('/accept/:id', async (req, res) => {
  // Route to accept a leave request
  const { acceptingEmail, priority } = req.query; // Email of the accepting user and priority

  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).send('<h3>This Request mail is expaired..You Too late..! </h3>.');

    // Check if the request has expired
    // if (await checkEmailExpiration(leaveRequest)) {
    //   return res.send('<h1>This email is expired.</h1>');
    // }

    // Check if the request has already been accepted
    if (leaveRequest.status === 'Accepted') {
      return res.send('<h1>This request has already been accepted.</h1>');
    }

    // Mark the request as accepted by the current user
    leaveRequest.status = 'Accepted';
    leaveRequest.acceptedBy = acceptingEmail;
    await leaveRequest.save();

    // Check if the accepting user is from the first priority (Remainder users)
    if (parseInt(priority) === 1) {
      // Update the status in the remainder database to 'claimed'
      await Remainder.updateOne(
        { acceptedUserEmail: leaveRequest.email, requesterEmail: leaveRequest.acceptedBy },
        { $set: { status: 'claimed' } }
      );

      // Set timeout to delete the claimed record after 1 minute
      setTimeout(async () => {
        try {
          await Remainder.deleteMany({ status: 'claimed' });
          console.log('Deleted claimed record after 1 minute for first priority.');
        } catch (error) {
          console.error('Error deleting claimed record:', error);
        }
      }, 60 * 1000); // 1 minute

      setTimeout(async () => {
        try {
          await LeaveRequest.deleteMany({ status: 'Accepted' });
          // console.log('Deleted Pending records from leaveRequest database.');
          console.log('This mail is expired successfully...no one access this mail..!')
        } catch (error) {
          console.error('Error deleting claimed records:', error);
        }
      },2* 60 * 1000);
      
    } else {
      // If other priorities accept the request, save the accepted user in the Remainder database
      const remainder = new Remainder({
        branch: leaveRequest.branch,
        year: leaveRequest.year,
        sem: leaveRequest.sem,
        requesterEmail: leaveRequest.email,
        acceptedUserEmail: leaveRequest.acceptedBy
      });
      await remainder.save();
    }

    // Fetch details of the accepting user from the Register database
    const acceptingUser = await Register.findOne(
      { email: leaveRequest.acceptedBy },
      'name year sem subj branch section'
    );

    // Send an email to the requester with details of the accepting user
    await sendEmail(
      leaveRequest.email,
      'GMRit-CA-Accepted message 👋',
      `
      <div style="background-color:grey; border:2px solid yellow; display:flex;align-items:center;justify-content:center; color:white; border-radius:3rem;">
        <div style="margin:10px; padding:20px;">
        <h1>Your request has been accepted by <b style="color:yellow; font-size:25px;">${acceptingUser.name}..<b>👋</h1>
        <h3 style="color:yellow; font-size:18px;">Faculty details:</h3>
        <ul style="font-size:18px; color:white;">
          <li>Branch: ${acceptingUser.branch}</li>
          <li>Year: ${acceptingUser.year}</li>
          <li>Semester: ${acceptingUser.sem}</li>
          <li>Section: ${acceptingUser.section}</li>
          <li>Subject: ${acceptingUser.subj}</li>
          <li>Leave Date: <b> ${formatDate(leaveRequest.leaveDate)} <b> on <b>${leaveRequest.dayName}<b></li>
        </ul>
        </div>
      </div>
      `
    );

    res.send('<h1 style="align-items:center;display:flex; justify-content:center; color:white; background-color:green; padding:10px;  border-radius:3rem;">You accepted the CA-request successfully...</h1>');
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).send('Error accepting request');
  }
});



// Route to reject a leave request
router.get('/reject/:id', async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) return res.status(404).send('Leave Request not found.');

    leaveRequest.status = 'Rejected';
    // await leaveRequest.save();

    // Notify requester about rejection
    // await sendEmail(leaveRequest.email, 'Class Adjustment Request Rejected', `
    //   <div>
    //     <h1>Your request has been rejected.</h1>
    //   </div>
    // `);

    res.send('<h1 style="align-items:center; color:white; background-color:red;display:flex; justify-content:center; padding:10px; ">You rejected the request successfully.</h1>');
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).send('Error rejecting request');
  }
});




// Route to reject a leave request
// router.get('/reject/:id', async (req, res) => {
//   try {
//     const leaveRequest = await LeaveRequest.findById(req.params.id);
//     if (!leaveRequest) return res.status(404).send('Leave Request not found.');

//     leaveRequest.status = 'Rejected';
//     // await leaveRequest.save();

//     // Notify requester about rejection
//     // await sendEmail(leaveRequest.email, 'Class Adjustment Request Rejected', `
//     //   <div>
//     //     <h1>Your request has been rejected.</h1>
//     //     <p>Thank you for your response!</p>
//     //   </div>
//     // `);

//     res.send('<h1>You rejected the request successfully.</h1>');
//   } catch (error) {
//     console.error('Error rejecting request:', error);
//     res.status(500).send('Error rejecting request');
//   }
// });

// Fetch all leave requests (with accepted details)
 router.get('/', async (req, res) => {
  try {
    // Fetch all leave requests and populate the 'acceptedBy' field with user details from the 'registers' collection
    const leaveRequests = await LeaveRequest.find()
      .populate('acceptedBy')  // Populate the 'acceptedBy' field with full user details
      .exec();

    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    res.status(500).send('Server error');
  }
});

router.post('/accept', async (req, res) => {
  try {
    const { leaveRequestId, acceptedByEmail } = req.body;

    // Find the user in the 'registers' collection by email
    const acceptedUser = await Register.findOne({ email: acceptedByEmail });

    if (!acceptedUser) {
      return res.status(404).json({ message: 'User not found in registers collection' });
    }

    // Find the leave request and update it with the ObjectId of the accepted user
    const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
      leaveRequestId,
      { 
        status: 'Accepted',
        acceptedBy: acceptedUser._id // Store ObjectId from 'registers'
      },
      { new: true }
    );

    if (!updatedLeaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    res.json({ message: 'Leave request accepted', leaveRequest: updatedLeaveRequest });
  } catch (error) {
    console.error('Error accepting leave request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Fetch leave requests along with accepted user details
router.get('/api/leave', async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find();

    // Fetch accepted user details for each leave request
    const leaveRequestsWithUserDetails = await Promise.all(leaveRequests.map(async (request) => {
      if (request.acceptedBy) {
        // Fetch the user details from the registers database using acceptedBy email
        const user = await Register.findOne({ email: request.acceptedBy });
        return {
          ...request.toObject(),
          acceptedUserDetails: user ? {
            name: user.name,
           
          } : null
        };
      }
      console.log(name)
      return {
        
        ...request.toObject(),
        acceptedUserDetails: null
      };
    }));

    res.json(leaveRequestsWithUserDetails);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching leave requests with user details' });
  }
});


module.exports = router;


// // Fetch only accepted leave requests
// // Fetch leave requests along with acceptedBy user details
// router.get('/', async (req, res) => {
//   try {
//     // Fetch all leave requests and populate the 'acceptedBy' field with user details from the 'registers' collection
//     const leaveRequests = await LeaveRequest.find()
//       .populate('acceptedBy')  // Populate the 'acceptedBy' field with full user details
//       .exec();

//     res.json(leaveRequests);
//   } catch (error) {
//     console.error('Error fetching leave requests:', error);
//     res.status(500).send('Server error');
//   }
// });

// router.post('/accept', async (req, res) => {
//   try {
//     const { leaveRequestId, acceptedByEmail } = req.body;

//     // Find the user in the 'registers' collection by email
//     const acceptedUser = await Register.findOne({ email: acceptedByEmail });

//     if (!acceptedUser) {
//       return res.status(404).json({ message: 'User not found in registers collection' });
//     }

//     // Find the leave request and update it with the ObjectId of the accepted user
//     const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
//       leaveRequestId,
//       { 
//         status: 'Accepted',
//         acceptedBy: acceptedUser._id // Store ObjectId from 'registers'
//       },
//       { new: true }
//     );

//     if (!updatedLeaveRequest) {
//       return res.status(404).json({ message: 'Leave request not found' });
//     }

//     res.json({ message: 'Leave request accepted', leaveRequest: updatedLeaveRequest });
//   } catch (error) {
//     console.error('Error accepting leave request:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// // Fetch leave requests along with accepted user details
// router.get('/api/leave', async (req, res) => {
//   try {
//     const leaveRequests = await LeaveRequest.find();

//     // Fetch accepted user details for each leave request
//     const leaveRequestsWithUserDetails = await Promise.all(leaveRequests.map(async (request) => {
//       if (request.acceptedBy) {
//         // Fetch the user details from the registers database using acceptedBy email
//         const user = await Register.findOne({ email: request.acceptedBy });
//         return {
//           ...request.toObject(),
//           acceptedUserDetails: user ? {
//             name: user.name,
           
//           } : null
//         };
//       }
//       console.log(name)
//       return {
        
//         ...request.toObject(),
//         acceptedUserDetails: null
//       };
//     }));

//     res.json(leaveRequestsWithUserDetails);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching leave requests with user details' });
//   }
// });


// Remainder database model
// const mongoose = require('mongoose');
// const remainderSchema = new mongoose.Schema({
//   requesterEmail: { type: String, required: true },
//   acceptedUserEmail: { type: String, required: true }
// });
// const Remainder = mongoose.model('Remainder', remainderSchema);


// // Fetch all leave requests (with accepted details)
// // Fetch only accepted leave requests
// // Fetch leave requests along with acceptedBy user details
// router.get('/', async (req, res) => {
//   try {
//     // Fetch all leave requests and populate the 'acceptedBy' field with user details from the 'registers' collection
//     const leaveRequests = await LeaveRequest.find()
//       .populate('acceptedBy')  // Populate the 'acceptedBy' field with full user details
//       .exec();

//     res.json(leaveRequests);
//   } catch (error) {
//     console.error('Error fetching leave requests:', error);
//     res.status(500).send('Server error');
//   }
// });

// router.post('/accept', async (req, res) => {
//   try {
//     const { leaveRequestId, acceptedByEmail } = req.body;

//     // Find the user in the 'registers' collection by email
//     const acceptedUser = await Register.findOne({ email: acceptedByEmail });

//     if (!acceptedUser) {
//       return res.status(404).json({ message: 'User not found in registers collection' });
//     }

//     // Find the leave request and update it with the ObjectId of the accepted user
//     const updatedLeaveRequest = await LeaveRequest.findByIdAndUpdate(
//       leaveRequestId,
//       { 
//         status: 'Accepted',
//         acceptedBy: acceptedUser._id // Store ObjectId from 'registers'
//       },
//       { new: true }
//     );

//     if (!updatedLeaveRequest) {
//       return res.status(404).json({ message: 'Leave request not found' });
//     }

//     res.json({ message: 'Leave request accepted', leaveRequest: updatedLeaveRequest });
//   } catch (error) {
//     console.error('Error accepting leave request:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// // Fetch leave requests along with accepted user details
// router.get('/api/leave', async (req, res) => {
//   try {
//     const leaveRequests = await LeaveRequest.find();

//     // Fetch accepted user details for each leave request
//     const leaveRequestsWithUserDetails = await Promise.all(leaveRequests.map(async (request) => {
//       if (request.acceptedBy) {
//         // Fetch the user details from the registers database using acceptedBy email
//         const user = await Register.findOne({ email: request.acceptedBy });
//         return {
//           ...request.toObject(),
//           acceptedUserDetails: user ? {
//             name: user.name,
           
//           } : null
//         };
//       }
//       console.log(name)
//       return {
        
//         ...request.toObject(),
//         acceptedUserDetails: null
//       };
//     }));

//     res.json(leaveRequestsWithUserDetails);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching leave requests with user details' });
//   }
// });

// ------------------------------------------------------------------------