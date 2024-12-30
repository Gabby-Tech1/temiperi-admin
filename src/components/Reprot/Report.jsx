import React, { useReducer, useState } from 'react'
import './report.css'

const Report = () => {

  const [date, setDate] = useState(new Date() )
  return (
    <div className='report_container'>
      <div className="recent_reports">
        <h3>Recent Reports</h3>
        <div className='report_dis'>
          <p className='recent_report_title'>Report one</p>
          <div className='report_time'>
            <p>Date</p>
            <p>Time</p>
          </div>
        </div>

        <div className='report_dis'>
          <p className='recent_report_title'>Report one</p>
          <div className='report_time'>
            <p>{date.getDate()}th</p>
            <p>{date.getMonth() + 1}</p>
          </div>
        </div>

        <div className='report_dis'>
          <p className='recent_report_title'>Report one</p>
          <div className='report_time'>
            <p>date</p>
            <p>Time</p>
          </div>
        </div>
      </div>

      <div className="report_body">
        <h2>Write Your Report</h2>
        <input type="text" placeholder='Title'/>
        <textarea name="" id="" placeholder='write here' ></textarea>
        <div className="btns">
          <button onClick={'https://mail.google.com/'}>Save</button>
          <button>Email</button>

        </div>
      </div>
    </div>
  )
}

export default Report