import {useRef, useState, useEffect, useContext} from 'react';
import {useNavigate} from "react-router-dom";
import AuthContext from "../context/AuthProvider";
import axios from 'axios';

// TODO change semantics from user to email or vice-versa

const Login = () => {
    // authentication backend
    const { setAuth } = useContext(AuthContext);

    const navigate = useNavigate();
    

    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLInputElement>(null);

    const [user,setUser] = useState('');
    const [pwd, setPwd] = useState('');
    const [errMsg, setErrMsg] = useState('');

    useEffect(() => {
        userRef.current?.focus();
    }, [])

    useEffect(() => {
        setErrMsg('');
    }, [user, pwd])

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        try {
            const response = await axios.post(
                "http://localhost:8000/login", 
                {email: user, password: pwd}, 
                {withCredentials: true});
            setAuth({user: response.data.user});
            navigate('/home')
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) {
                setErrMsg(err.response.data?.detail)
            } else {
                setErrMsg("Unable to connect to server")
            }
        }
    }

  return (
    <>
    <section>
      <p ref={errRef} className =
      {errMsg ? "errmsg" : "offscreen"} aria-live = "assertive">{errMsg}</p>
      <h1> Sign In</h1>
      <form onSubmit = {handleSubmit}>
        <label htmlFor="username"> Username: </label>
        <input
            type = "text"
            id = "username"
            ref = {userRef}
            autoComplete = "off"
            onChange={(e) => setUser(e.target.value)}
            value = {user}
            required
            />

        <label htmlFor="password"> Password: </label>
        <input
            type = "password"
            id = "password"
            onChange={(e) => setPwd(e.target.value)}
            value = {pwd}
            required
            />
            <button style={{marginLeft: 10, color: 'white'}}>Sign In</button> {/*TODO remove inline style*/}
      </form>
    </section>
    </>
  )
}

export default Login
