import { useState } from "react"
import XSvg from "../../../components/svgs/X";
import { Link } from "react-router-dom";

import { MdOutlineMail } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { MdPassword } from "react-icons/md";
import { MdDriveFileRenameOutline } from "react-icons/md";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    fullName: "",
    password: "",
  });

  //e.preventDefault() 기능을 위한 함수 onClick()에 바로 함수를 정의하여도 됨
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  }

  //input을 통해 업데이트된 value를 setFormData에 추가하여 state를 변경한다.
  //update시 spread를 사용해 기존값에 업데이트된 값만 추가한다.
  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  }

  const isError =false;

  return (
    <div className="max-w-screen-xl mx-auto flex h-screen px-10">
      <div className="flex-1 hidden lg:flex items-center justify-center">
        <XSvg className="lg:w-2/3 fill-white" />
      </div>
      <div className="flex-1 flex flex-col justify-center items-center">
        <form className="lg:w-2/3 mx-auto md:mx-20 flex gap-4 flex-col" onSubmit={handleSubmit}>
          <XSvg className="w-24 lg:hidden fill-white" />
          <h1 className="text-4xl font-extrabold text-white">Join today.</h1>
          <label className="input input-bordered rounded flex items-center gap-2">
            <MdOutlineMail />
            <input 
              type='email'
              className='grow'
              placeholder='Email'
              name='email'
              onChange={handleInputChange}
              value={formData.email}
            />
          </label>
          <div className="flex gap-4 flex-wrap">
            <label className="input input-bordered rounded flex items-center gap-2 flex-1">
              <FaUser />
              <input 
                type='text'
                className='grow'
                placeholder='Username'
                name='username'
                onChange={handleInputChange}
                value={formData.username}
              />
            </label>
            <label className="input input-bordered rounded flex items-center gap-2 flex-1">
              <MdDriveFileRenameOutline />
              <input 
                type='text'
                className='grow'
                placeholder='Full Name'
                name='fullName'
                onChange={handleInputChange}
                value={formData.fullName}
              />
            </label>
          </div>
          <label className="input input-bordered rounded flex items-center gap-2">
            <MdPassword />
            <input 
               type='password'
               className='grow'
               placeholder='Password'
               name='password'
               onChange={handleInputChange}
               value={formData.password}
            />
          </label>
          <button className="btn rounded-full btn-primary text-white btn-outline w-full">Sign Up</button>
          {/* isError가 true로 에러가 발생하면 관련 태그 출력 */}
          {isError && <p className='text-red-500'>Something went wrong</p>}
        </form>
        <div className='flex flex-col lg:w-2/3 gap-2 mt-4'>
          <p className="text-white text-lg">Already have an account?</p>
          <Link to='/login'>
            <button className="btn rounded-full btn-primary text-white btn-outline w-full">Sign in</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage;