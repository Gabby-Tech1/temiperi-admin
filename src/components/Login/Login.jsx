import React, { useState } from 'react'
import './login.css'
import { asset } from '../../assets/assets'
import axios from 'axios'
import { NavLink } from 'react-router-dom'

const Login = ({url}) => {

   const [currentSate, setCurrentState] = useState('Login')
   const [data, setData] = useState({
      name: '',
      email: '',
      password: ''
   })

   const onChangeHandler = (event)=>{
      const name = event.target.name;
      const value = event.target.value;
      setData(data => ({...data, [name]:value}))
   }

   const onLogin = async (event) => {
      let newUrl = url;
      if(currentSate === "Login"){
         newUrl +='/login'
      } else {
         newUrl += '/analysis'
      }

      const response = await axios.post(newUrl, data);

      if(response.data.success){
         localStorage.setItem(response.data);
         setShowLogin(false)
      } else {
         alert(response.data.message);
      }
   }

  return (
    <div className='bg'>
      <div className="bg2"></div>
       <div className="login_container">
         <div className='container_left'>
            <img src={asset.logo} alt="" />
         </div>

         <div className="container_right">
            <form action="" onSubmit={onLogin}>
               <div className='login_details'>
                  {currentSate === 'Login'? <h2>Welcome Back</h2> : <h2>Welcome</h2>}
                  {currentSate === 'Login' ? <p>Log in into your account</p> :<p>Sign Up</p>}
               </div>
               {currentSate === 'Login' ? <></>
               :<label htmlFor="">
                  Name 
                  <input name='name' type="text" onChange={onChangeHandler} placeholder='Name' value={data.name} required/>
               </label>}
               
               <label htmlFor="">
                  Email 
                  <input name='email' type="text" onChange={onChangeHandler} placeholder='tettehephraim.64@gamil.com' value={data.email} required/>
               </label>
               <label htmlFor="">
                  Password
                  <input name='password' type="password" onChange={onChangeHandler} placeholder='********' value={data.password} required/>
               </label>

               <div className="remember_me">
                  <div className='remember_input'>
                     <input type="radio" />
                     <small>Remember Me</small>
                  </div>

                  <div className="forget_password">
                     <small>Forgot Password</small>
                  </div>
               </div>
{/* 
               <NavLink to={'/analysis'}>
                  <button type='submit' className='form_btn'>
                     {currentSate === 'Sign Up'
                        ? 'Register'
                        : 'Login'
                     }
                  </button>
               </NavLink> */}
               <button type='submit' className='form_btn'>
                     {currentSate === 'Sign Up'
                        ? 'Register'
                        : 'Login'
                     }
                  </button>

               {currentSate === 'Login'
                  ? <p>Register <span onClick={()=>setCurrentState('Sign Up')}>Click Here</span></p>
                  : <p>Login <span onClick={()=>setCurrentState('Login')}>Click Here</span></p>
               }
            </form>
         </div>
      </div>
    </div>
  )
}

export default Login