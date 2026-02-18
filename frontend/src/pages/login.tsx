import {useRef, useState, useEffect, useContext} from 'react';
import {useNavigate} from "react-router-dom";
import AuthContext from "../context/AuthProvider";

const Login = () => {
    // authentication backend
    // const { setAuth } = useContext(AuthContext);

    const navigate = useNavigate();
    

    const userRef = useRef<HTMLInputElement>(null);
    const errRef = useRef<HTMLInputElement>(null);

    const [user,setUser] = useState('');
    const [pwd, setPwd] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [success,setSuccess] = useState(false);

    useEffect(() => {
        userRef.current?.focus();
    }, [user, pwd])

    useEffect(() => {
        setErrMsg('');
    }, [user, pwd])

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        //TODO: try catch the credentials using axios, currently everything is sucessful login

        e.preventDefault();
        console.log(user,pwd);
        setUser('');
        setPwd('');

        setSuccess(true);
    }

  return (
    <>
        {success ? (
            navigate('/home')
        ) : (

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
            <button>Sign In</button>
      </form>

    </section>
    )}
    </>
  )
}

export default Login
